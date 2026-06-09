#!/usr/bin/env node

/**
 * Post-Quantum Cryptography (PQC) Audit Tool for P31 Labs
 * 
 * This script analyzes the codebase for classical cryptographic primitives
 * that are vulnerable to quantum attacks and provides migration guidance
 * to NIST-approved PQC standards.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Quantum vulnerability patterns and their replacements
const QUANTUM_VULNERABILITIES = {
  // Algorithms vulnerable to Shor's Algorithm
  shor_vulnerable: {
    patterns: [
      /crypto\.createSign\(['"]RSA-SHA\d+['"]\)/g,
      /crypto\.createVerify\(['"]RSA-SHA\d+['"]\)/g,
      /crypto\.sign\(['"]RSA-SHA\d+['"]\)/g,
      /crypto\.verify\(['"]RSA-SHA\d+['"]\)/g,
      /crypto\.generateKeyPair\(['"]rsa['"]\)/g,
      /crypto\.generateKeyPairSync\(['"]rsa['"]\)/g,
      /crypto\.createDiffieHellman\(/g,
      /crypto\.createECDH\(/g,
      /crypto\.createCipher\(['"]rsa['"]\)/g,
      /crypto\.createDecipher\(['"]rsa['"]\)/g,
      /crypto\.publicEncrypt\(/g,
      /crypto\.privateEncrypt\(/g,
      /crypto\.publicDecrypt\(/g,
      /crypto\.privateDecrypt\(/g,
      /jwk\.kty\s*===\s*['"]RSA['"]/g,
      /algorithm\s*:\s*['"]RS\d+['"]/g,
      /alg\s*:\s*['"]RS\d+['"]/g,
      /key\.type\s*===\s*['"]rsa['"]/g
    ],
    description: "Vulnerable to Shor's Algorithm - breaks RSA, ECDSA, DSA, and Diffie-Hellman",
    replacement: "FIPS 203 ML-KEM (Key Encapsulation), FIPS 204 ML-DSA (Digital Signatures)",
    risk_level: "CRITICAL"
  },

  // Algorithms vulnerable to Grover's Algorithm
  grover_vulnerable: {
    patterns: [
      /crypto\.createHash\(['"]sha1['"]\)/g,
      /crypto\.createHash\(['"]md5['"]\)/g,
      /crypto\.createHash\(['"]sha256['"]\)/g,
      /crypto\.createHash\(['"]sha512['"]\)/g,
      /crypto\.createCipher\(['"]aes-128['"]\)/g,
      /crypto\.createCipher\(['"]aes-192['"]\)/g,
      /crypto\.createCipher\(['"]aes-256['"]\)/g,
      /crypto\.createCipheriv\(['"]aes-128['"]\)/g,
      /crypto\.createCipheriv\(['"]aes-192['"]\)/g,
      /crypto\.createCipheriv\(['"]aes-256['"]\)/g,
      /crypto\.createDecipher\(['"]aes-128['"]\)/g,
      /crypto\.createDecipher\(['"]aes-192['"]\)/g,
      /crypto\.createDecipher\(['"]aes-256['"]\)/g,
      /crypto\.createDecipheriv\(['"]aes-128['"]\)/g,
      /crypto\.createDecipheriv\(['"]aes-192['"]\)/g,
      /crypto\.createDecipheriv\(['"]aes-256['"]\)/g,
      /crypto\.randomBytes\(\s*(?:16|24|32)\s*\)/g, // Common key sizes
      /crypto\.pbkdf2\(/g,
      /crypto\.scrypt\(/g,
      /crypto\.hmac\(['"]sha256['"]\)/g,
      /crypto\.hmac\(['"]sha512['"]\)/g
    ],
    description: "Vulnerable to Grover's Algorithm - reduces effective security by half",
    replacement: "Double key sizes (AES-256), SPHINCS+ (Hash-based signatures), FIPS 205 SLH-DSA",
    risk_level: "HIGH"
  },

  // JWT-specific vulnerabilities
  jwt_vulnerable: {
    patterns: [
      /algorithm\s*:\s*['"]RS256['"]/g,
      /algorithm\s*:\s*['"]RS384['"]/g,
      /algorithm\s*:\s*['"]RS512['"]/g,
      /algorithm\s*:\s*['"]ES256['"]/g,
      /algorithm\s*:\s*['"]ES384['"]/g,
      /algorithm\s*:\s*['"]ES512['"]/g,
      /algorithm\s*:\s*['"]HS256['"]/g,
      /algorithm\s*:\s*['"]HS384['"]/g,
      /algorithm\s*:\s*['"]HS512['"]/g,
      /sign\([^,]+,\s*[^,]+,\s*{[^}]*algorithm\s*:\s*['"](?:RS|ES|HS)\d+['"]\}/g,
      /verify\([^,]+,\s*[^,]+,\s*{[^}]*algorithm\s*:\s*['"](?:RS|ES|HS)\d+['"]\}/g
    ],
    description: "JWT tokens using quantum-vulnerable signing algorithms",
    replacement: "FIPS 204 ML-DSA for signatures, FIPS 203 ML-KEM for encryption",
    risk_level: "CRITICAL"
  },

  // TLS/SSL vulnerabilities
  tls_vulnerable: {
    patterns: [
      /cipherSuites\s*:\s*\[[^\]]*['"](?:ECDHE|DHE)[^'"]*RSA[^'"]*['"]/g,
      /cipherSuites\s*:\s*\[[^\]]*['"](?:ECDHE|DHE)[^'"]*ECDSA[^'"]*['"]/g,
      /secureProtocol\s*:\s*['"]TLSv1\.\d+['"]/g,
      /minVersion\s*:\s*['"]TLSv1\.\d+['"]/g,
      /maxVersion\s*:\s*['"]TLSv1\.\d+['"]/g,
      /ecdhCurve\s*:\s*['"](?:prime256v1|secp384r1|secp521r1)['"]/g,
      /keyExchange\s*:\s*['"](?:RSA|ECDH|DH)['"]/g,
      /signatureAlgorithm\s*:\s*['"](?:RSA|ECDSA)['"]/g
    ],
    description: "TLS configurations using quantum-vulnerable key exchange and signatures",
    replacement: "PQC-safe cipher suites, hybrid key exchange with FIPS 203 ML-KEM",
    risk_level: "HIGH"
  }
};

class PQCAudit {
  constructor() {
    this.results = {
      vulnerabilities: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      recommendations: []
    };
  }

  /**
   * Scan a directory recursively for files
   */
  scanDirectory(dir, fileExtensions = ['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml']) {
    console.log(`${colors.blue}Scanning directory: ${dir}${colors.reset}`);
    
    const files = this.getAllFiles(dir, fileExtensions);
    
    files.forEach(file => {
      this.analyzeFile(file);
    });

    return this.results;
  }

  /**
   * Get all files with specified extensions
   */
  getAllFiles(dir, extensions) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', '.vscode', 'dist', 'build', 'coverage'].includes(item)) {
            files = files.concat(this.getAllFiles(fullPath, extensions));
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      });
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not read directory ${dir}: ${error.message}${colors.reset}`);
    }
    
    return files;
  }

  /**
   * Analyze a single file for quantum vulnerabilities
   */
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      Object.entries(QUANTUM_VULNERABILITIES).forEach(([vulnType, config]) => {
        config.patterns.forEach((pattern, patternIndex) => {
          let match;
          
          while ((match = pattern.exec(content)) !== null) {
            const lineNumber = this.getLineNumber(content, match.index);
            const context = this.getContext(lines, lineNumber);
            
            this.results.vulnerabilities.push({
              file: filePath,
              line: lineNumber,
              vulnerability: vulnType,
              pattern: pattern.source,
              description: config.description,
              replacement: config.replacement,
              risk_level: config.risk_level,
              context: context
            });
            
            this.results.summary[config.risk_level.toLowerCase()]++;
            this.results.summary.total++;
          }
          
          // Reset regex lastIndex for next iteration
          pattern.lastIndex = 0;
        });
      });
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not read file ${filePath}: ${error.message}${colors.reset}`);
    }
  }

  /**
   * Get line number from character position
   */
  getLineNumber(content, position) {
    return content.substring(0, position).split('\n').length;
  }

  /**
   * Get context around the vulnerability
   */
  getContext(lines, lineNumber, contextLines = 3) {
    const start = Math.max(0, lineNumber - contextLines - 1);
    const end = Math.min(lines.length, lineNumber + contextLines);
    
    return lines.slice(start, end).map((line, index) => ({
      line: start + index + 1,
      content: line,
      isVulnerable: start + index + 1 === lineNumber
    }));
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    const vulnTypes = this.results.vulnerabilities.map(v => v.vulnerability);
    
    if (vulnTypes.includes('shor_vulnerable')) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        category: 'Shor\'s Algorithm Vulnerabilities',
        action: 'Replace RSA, ECDSA, and Diffie-Hellman with FIPS 203 ML-KEM and FIPS 204 ML-DSA',
        timeline: 'Immediate (within 3 months)',
        impact: 'Prevents complete cryptographic compromise when quantum computers become available'
      });
    }

    if (vulnTypes.includes('grover_vulnerable')) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'Grover\'s Algorithm Vulnerabilities',
        action: 'Double key sizes for symmetric encryption and hash functions',
        timeline: 'Within 6 months',
        impact: 'Maintains security level against quantum-enhanced brute force attacks'
      });
    }

    if (vulnTypes.includes('jwt_vulnerable')) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        category: 'JWT Token Vulnerabilities',
        action: 'Migrate JWT signing to quantum-resistant algorithms',
        timeline: 'Immediate (within 3 months)',
        impact: 'Prevents token forgery and authentication bypass'
      });
    }

    if (vulnTypes.includes('tls_vulnerable')) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'TLS Configuration Vulnerabilities',
        action: 'Update TLS configurations to use PQC-safe cipher suites',
        timeline: 'Within 6 months',
        impact: 'Ensures secure communication channels remain secure'
      });
    }
  }

  /**
   * Generate detailed report
   */
  generateReport() {
    this.generateRecommendations();
    
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bold}${colors.cyan}P31 Labs Post-Quantum Cryptography Audit Report${colors.reset}`);
    console.log('='.repeat(80));
    
    // Summary
    console.log(`\n${colors.bold}Vulnerability Summary:${colors.reset}`);
    console.log(`  Critical: ${colors.red}${this.results.summary.critical}${colors.reset}`);
    console.log(`  High: ${colors.yellow}${this.results.summary.high}${colors.reset}`);
    console.log(`  Medium: ${colors.blue}${this.results.summary.medium}${colors.reset}`);
    console.log(`  Low: ${colors.green}${this.results.summary.low}${colors.reset}`);
    console.log(`  Total: ${colors.bold}${this.results.summary.total}${colors.reset}`);
    
    // Detailed findings
    if (this.results.vulnerabilities.length > 0) {
      console.log(`\n${colors.bold}Detailed Findings:${colors.reset}`);
      
      this.results.vulnerabilities.forEach((vuln, index) => {
        console.log(`\n${colors.bold}Vulnerability ${index + 1}:${colors.reset}`);
        console.log(`  File: ${colors.cyan}${vuln.file}${colors.reset}`);
        console.log(`  Line: ${colors.yellow}${vuln.line}${colors.reset}`);
        console.log(`  Risk Level: ${this.getRiskColor(vuln.risk_level)}${vuln.risk_level}${colors.reset}`);
        console.log(`  Description: ${vuln.description}`);
        console.log(`  Replacement: ${vuln.replacement}`);
        
        console.log(`  Context:`);
        vuln.context.forEach(ctx => {
          const marker = ctx.isVulnerable ? '>>>' : '   ';
          const lineColor = ctx.isVulnerable ? colors.red : colors.white;
          console.log(`    ${marker} ${lineColor}${ctx.line}: ${ctx.content}${colors.reset}`);
        });
      });
    } else {
      console.log(`${colors.green}\n✅ No quantum vulnerabilities detected!${colors.reset}`);
    }
    
    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log(`\n${colors.bold}Migration Recommendations:${colors.reset}`);
      
      this.results.recommendations.forEach((rec, index) => {
        console.log(`\n${colors.bold}Recommendation ${index + 1}:${colors.reset}`);
        console.log(`  Priority: ${this.getRiskColor(rec.priority)}${rec.priority}${colors.reset}`);
        console.log(`  Category: ${rec.category}`);
        console.log(`  Action: ${rec.action}`);
        console.log(`  Timeline: ${rec.timeline}`);
        console.log(`  Impact: ${rec.impact}`);
      });
    }
    
    // NIST PQC Standards Reference
    console.log(`\n${colors.bold}NIST PQC Standards Reference:${colors.reset}`);
    console.log(`  FIPS 203: ML-KEM (Module-Lattice Key Encapsulation Mechanism)`);
    console.log(`  FIPS 204: ML-DSA (Module-Lattice Digital Signature Algorithm)`);
    console.log(`  FIPS 205: SLH-DSA (Stateless Hash-Based Digital Signature Algorithm)`);
    console.log(`  FIPS 206: SPHINCS+ (SPHINCS Plus Signature Scheme)`);
    
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bold}Next Steps:${colors.reset}`);
    console.log('1. Review critical vulnerabilities and plan immediate mitigation');
    console.log('2. Establish PQC migration timeline based on recommendations');
    console.log('3. Begin testing NIST PQC algorithms in development environment');
    console.log('4. Update cryptographic libraries to support PQC standards');
    console.log('5. Train development team on PQC implementation best practices');
    console.log('='.repeat(80));
  }

  /**
   * Get color for risk level
   */
  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'CRITICAL': return colors.red;
      case 'HIGH': return colors.yellow;
      case 'MEDIUM': return colors.blue;
      case 'LOW': return colors.green;
      default: return colors.white;
    }
  }

  /**
   * Export results to JSON
   */
  exportResults(outputFile = 'pqc-audit-results.json') {
    try {
      fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
      console.log(`${colors.green}Audit results exported to: ${outputFile}${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error exporting results: ${error.message}${colors.reset}`);
    }
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2);
  const targetDir = args[0] || '.';
  const outputFile = args[1] || 'pqc-audit-results.json';

  console.log(`${colors.bold}${colors.cyan}P31 Labs Post-Quantum Cryptography Audit${colors.reset}`);
  console.log(`Target Directory: ${targetDir}`);
  console.log(`Output File: ${outputFile}\n`);

  const audit = new PQCAudit();
  const results = audit.scanDirectory(targetDir);
  
  audit.generateReport();
  audit.exportResults(outputFile);
  
  // Exit with error code if critical vulnerabilities found
  if (results.summary.critical > 0) {
    console.log(`${colors.red}\n⚠️  Critical vulnerabilities detected. Immediate action required.${colors.reset}`);
    process.exit(1);
  } else if (results.summary.high > 0) {
    console.log(`${colors.yellow}\n⚠️  High-risk vulnerabilities detected. Action recommended within 6 months.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.green}\n✅ No critical or high-risk vulnerabilities detected.${colors.reset}`);
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PQCAudit, QUANTUM_VULNERABILITIES };