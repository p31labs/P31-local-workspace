# P31 Labs Medical Device Compliance Manual

**Effective Date:** March 24, 2026  
**Version:** 1.0.0  
**Organization:** P31 Labs, Inc. (Georgia 501(c)(3) Nonprofit)

## Table of Contents

1. [Introduction and Scope](#1-introduction-and-scope)
2. [Regulatory Framework](#2-regulatory-framework)
3. [Quality Management System](#3-quality-management-system)
4. [Device Classification and Exemptions](#4-device-classification-and-exemptions)
5. [Design and Development Controls](#5-design-and-development-controls)
6. [Risk Management](#6-risk-management)
7. [Personal Goodwill Protection](#7-personal-goodwill-protection)
8. [Post-Quantum Cryptography Standards](#8-post-quantum-cryptography-standards)
9. [Documentation and Records](#9-documentation-and-records)
10. [Training and Competency](#10-training-and-competency)
11. [Inspection and Audit Procedures](#11-inspection-and-audit-procedures)
12. [Corrective and Preventive Actions](#12-corrective-and-preventive-actions)
13. [Post-Market Surveillance](#13-post-market-surveillance)
14. [Appendices](#14-appendices)

---

## 1. Introduction and Scope

### 1.1 Purpose
This manual establishes the comprehensive framework for P31 Labs' compliance with medical device regulations, specifically focusing on assistive communication technologies for neurodivergent individuals.

### 1.2 Scope
This manual applies to all activities related to the design, development, testing, manufacturing, distribution, and post-market surveillance of medical devices developed by P31 Labs.

### 1.3 Applicable Devices
- **Phenix Navigator System**: Class II Powered Communication System
- **Assistive Communication Devices**: Devices for individuals with speech and motor impairments
- **Neurodivergent Support Technologies**: Technologies supporting autism spectrum disorder and related conditions

### 1.4 Regulatory References
- 21 CFR Part 820 (Quality System Regulation)
- 21 CFR § 890.3710 (Powered Communication Systems)
- ISO 13485:2016 (Medical Devices Quality Management)
- ISO 14971:2019 (Risk Management)
- IEC 62304:2006 (Medical Device Software)

---

## 2. Regulatory Framework

### 2.1 FDA Classification
**Device Class:** Class II (Exempt from 510(k))
**Product Code:** ILQ (Powered Communication System)
**Regulation Number:** 21 CFR § 890.3710

### 2.2 Exemption Criteria
To maintain 510(k) exemption status, devices must:
- Conform to the definition of "Powered Communication System"
- Not incorporate "different fundamental scientific technology"
- Comply with general controls under 21 CFR Part 820
- Avoid features that would trigger § 890.9 limitations

### 2.3 Key Regulatory Requirements
- **Design Controls**: 21 CFR Part 820.30
- **Document Controls**: 21 CFR Part 820.40
- **Record Keeping**: 21 CFR Part 820.180
- **Risk Management**: ISO 14971 compliance
- **Software Validation**: IEC 62304 compliance

### 2.4 Personal Goodwill Integration
Medical device compliance must preserve Personal Goodwill protections:
- Device functionality must remain tied to specific user identity
- Cryptographic binding must prevent transferability
- Asset protection strategies must be maintained
- Bankruptcy and family law protections must be preserved

---

## 3. Quality Management System

### 3.1 Quality Policy
P31 Labs is committed to developing safe, effective, and accessible medical devices that enhance the lives of neurodivergent individuals while maintaining the highest standards of quality and regulatory compliance.

### 3.2 Quality Objectives
- 100% compliance with applicable regulatory requirements
- Zero critical non-conformances in device safety
- 95% on-time completion of development milestones
- 100% traceability of design changes
- Continuous improvement through risk-based decision making

### 3.3 Organizational Structure
**Quality Management Representative (QMR):** [Name]
**Medical Device Compliance Officer:** [Name]
**Risk Management Lead:** [Name]
**Document Control Manager:** [Name]

### 3.4 Document Control System
All quality system documents must:
- Be approved before release
- Be reviewed and updated as necessary
- Be available at points of use
- Be protected from damage and deterioration
- Be retained for appropriate periods

### 3.5 Record Keeping Requirements
Records must be maintained for:
- Design history files: 2 years after device discontinuance
- Device master records: 2 years after device discontinuance
- Quality records: 2 years after creation
- Risk management files: 10 years after device discontinuance

---

## 4. Device Classification and Exemptions

### 4.1 Classification Strategy
**Primary Classification:** Class II Medical Device
**Exemption Status:** 510(k) exempt under 21 CFR § 890.3710
**Justification:** Device meets definition of "Powered Communication System"

### 4.2 Exemption Maintenance
To maintain exemption status, P31 Labs must:
- Avoid incorporation of AI/ML that constitutes "different fundamental scientific technology"
- Maintain device function within defined scope
- Comply with general controls
- Avoid combination products

### 4.3 Risk-Based Classification
**Risk Level:** Medium (Class II)
**Justification:** Device provides communication function but does not support life-sustaining functions
**Mitigation:** Comprehensive risk management per ISO 14971

### 4.4 Personal Goodwill Classification
**Classification:** Non-transferable assistive technology
**Legal Basis:** Georgia family law (Miller v. Miller precedent)
**Protection:** Separate property, bankruptcy exempt, creditor protected

---

## 5. Design and Development Controls

### 5.1 Design and Development Planning
**Design Plan Requirements:**
- Design and development stages
- Review, verification, and validation activities
- Responsibilities and authorities
- Interface management between groups
- Risk management activities

**Key Milestones:**
- Design Input Approval
- Design Output Definition
- Design Review Completion
- Design Verification
- Design Validation
- Design Transfer

### 5.2 Design Input Requirements
**User Needs:**
- Communication assistance for neurodivergent individuals
- Accessibility for motor planning deficits (apraxia)
- Sensory processing disorder accommodations
- Proprioceptive feedback requirements

**Regulatory Requirements:**
- 21 CFR Part 820 compliance
- ISO 13485:2016 requirements
- IEC 62304 software requirements
- Accessibility standards (WCAG 2.1 AA)

**Technical Requirements:**
- Hardware Security Module integration
- Cryptographic identity binding
- Haptic feedback systems
- LoRa mesh networking
- Post-quantum cryptographic algorithms

### 5.3 Design Output Specifications
**Hardware Requirements:**
- ESP32 microcontroller with secure boot
- NXP SE050 EdgeLock Secure Element
- Kailh Choc Navy mechanical switches
- Linear Resonant Actuator (LRA)
- LoRa radio module (915 MHz)

**Software Requirements:**
- Custom firmware with cryptographic functions
- Text-to-speech engine integration
- Mesh networking protocols
- Risk management software components
- Post-quantum key exchange implementation

**Documentation Requirements:**
- Device Master Records (DMR)
- Bill of Materials (BOM)
- Software Design Documents
- Test protocols and procedures
- User documentation and training materials

### 5.4 Design Review Process
**Review Participants:**
- Design and development personnel
- Quality assurance representatives
- Risk management personnel
- Regulatory affairs (as needed)
- End-user representatives (as appropriate)

**Review Criteria:**
- Design input adequacy
- Regulatory compliance
- Risk mitigation effectiveness
- Personal Goodwill preservation
- Technical feasibility

### 5.5 Design Verification
**Verification Activities:**
- Hardware component testing
- Software unit and integration testing
- Cryptographic function validation
- Risk control effectiveness testing
- Regulatory requirement compliance testing

**Acceptance Criteria:**
- All design inputs satisfied
- Risk controls effective
- Regulatory requirements met
- Personal Goodwill protections maintained

### 5.6 Design Validation
**Validation Approach:**
- Clinical evaluation with target user population
- Usability testing with neurodivergent users
- Accessibility validation
- Real-world environment testing
- Long-term reliability assessment

**Validation Documentation:**
- Validation protocol and report
- User feedback and satisfaction data
- Performance metrics and outcomes
- Risk-benefit analysis
- Personal Goodwill impact assessment

---

## 6. Risk Management

### 6.1 Risk Management Process
**Framework:** ISO 14971:2019
**Scope:** All medical devices and related activities
**Responsibility:** Risk Management Lead with cross-functional team

### 6.2 Risk Analysis
**Hazard Identification:**
- Electrical hazards (low voltage, battery safety)
- Software failures (communication loss, incorrect output)
- Mechanical hazards (switch failure, component breakage)
- Usability hazards (user error, confusion)
- Cybersecurity hazards (unauthorized access, data breach)

**Risk Estimation:**
- Severity levels: Negligible, Minor, Critical, Catastrophic
- Probability levels: Frequent, Probable, Occasional, Remote, Improbable
- Risk acceptability criteria: ALARP (As Low As Reasonably Practicable)

### 6.3 Risk Evaluation
**Acceptable Risk Criteria:**
- No catastrophic risks acceptable
- Critical risks must be reduced to acceptable levels
- Minor and negligible risks acceptable with monitoring

**Risk Control Measures:**
- Inherent safety by design
- Protective measures in medical device itself or manufacturing
- Safety information (warnings, instructions for use)

### 6.4 Risk Control Verification
**Verification Activities:**
- Testing of risk control measures
- Validation of risk reduction effectiveness
- Documentation of residual risk acceptability
- Personal Goodwill impact verification

### 6.5 Post-Production Risk Management
**Monitoring Activities:**
- Post-market surveillance data review
- Complaint analysis and trending
- Field safety corrective actions
- Risk management file updates
- Personal Goodwill protection monitoring

---

## 7. Personal Goodwill Protection

### 7.1 Legal Framework
**Governing Law:** Georgia Code § 19-5-13 (Miller v. Miller precedent)
**Protection Scope:** Non-transferable intellectual property and technological developments
**Asset Protection:** Bankruptcy exempt, creditor protected, separate property

### 7.2 Technical Implementation
**Cryptographic Binding:**
- Hardware Security Module (HSM) integration
- Private key generation and storage in secure element
- Biometric authentication requirements
- Device identity verification protocols

**Non-Transferability Measures:**
- Cryptographic keys cannot be exported
- Device functionality tied to specific user identity
- "Bricking" protocol for unauthorized access attempts
- Personal Goodwill documentation and tracking

### 7.3 Asset Protection Strategies
**Bankruptcy Protection:**
- Unlimited exemption under 11 U.S.C. § 522(d)(9)
- Professional prescription requirement
- Medical necessity documentation
- Health aid classification maintenance

**Divorce Protection:**
- Separate property classification
- Personal Goodwill documentation
- Non-liquid asset characterization
- Professional goodwill precedent application

**Creditor Protection:**
- Non-attachable asset status
- Personal use requirement
- Professional exemption application
- Asset protection documentation

### 7.4 Compliance Monitoring
**Regular Reviews:**
- Personal Goodwill protection effectiveness
- Asset protection strategy compliance
- Legal precedent monitoring
- Regulatory requirement updates

---

## 8. Post-Quantum Cryptography Standards

### 8.1 Cryptographic Requirements
**Standards Compliance:** NIST PQC Standards (FIPS 203, 204, 205)
**Implementation Scope:** All cryptographic functions in medical devices
**Migration Strategy:** Gradual implementation with backward compatibility

### 8.2 Algorithm Selection
**Key Exchange:** CRYSTALS-KYBER (Module-Lattice based)
**Digital Signatures:** CRYSTALS-DILITHIUM (Module-Lattice based)
**Hash Functions:** SHA-3 (Keccak) family
**Symmetric Encryption:** AES-256 with PQC key exchange

### 8.3 Implementation Requirements
**Hardware Integration:**
- Secure Element support for PQC algorithms
- Hardware acceleration for cryptographic operations
- Secure key storage and management
- Cryptographic boundary protection

**Software Implementation:**
- PQC library integration
- Algorithm validation and testing
- Performance optimization
- Security assessment and validation

### 8.4 Migration Strategy
**Phase 1:** PQC algorithm integration in new devices
**Phase 2:** Hybrid implementation (classical + PQC)
**Phase 3:** Full PQC migration with legacy support
**Phase 4:** Legacy algorithm deprecation and removal

### 8.5 Security Assessment
**Validation Requirements:**
- Cryptographic algorithm testing
- Implementation security assessment
- Performance impact evaluation
- Regulatory compliance verification

---

## 9. Documentation and Records

### 9.1 Design History File (DHF)
**Required Documents:**
- Design plan and schedule
- Design input documentation
- Design output specifications
- Design review records
- Design verification and validation reports
- Design transfer documentation
- Design changes and modifications

**Personal Goodwill Documentation:**
- Asset protection strategy documentation
- Legal opinion letters
- Court precedent analysis
- Transfer restriction documentation

### 9.2 Device Master Record (DMR)
**Required Documents:**
- Device specifications
- Bill of materials
- Software documentation
- Labeling and packaging specifications
- Quality assurance procedures
- Acceptance criteria and test methods

### 9.3 Device History Record (DHR)
**Required Documents:**
- Production records
- Quality control records
- Device acceptance records
- Traceability documentation
- Non-conformance reports
- Corrective and preventive actions

### 9.4 Risk Management File (RMF)
**Required Documents:**
- Risk management plan
- Risk analysis reports
- Risk evaluation documentation
- Risk control measures
- Risk management review records
- Post-production risk management

### 9.5 Document Retention Schedule
**Retention Periods:**
- Design history files: 2 years after device discontinuance
- Device master records: 2 years after device discontinuance
- Device history records: 2 years after device discontinuance
- Risk management files: 10 years after device discontinuance
- Personal Goodwill documentation: Indefinite

---

## 10. Training and Competency

### 10.1 Training Requirements
**Initial Training:**
- Quality system requirements
- Medical device regulations
- Risk management principles
- Personal Goodwill protection
- Post-quantum cryptography

**Annual Training:**
- Regulatory updates
- Quality system changes
- Risk management updates
- Personal Goodwill compliance
- Security awareness

### 10.2 Competency Assessment
**Required Competencies:**
- Medical device regulatory knowledge
- Quality management system understanding
- Risk management principles application
- Personal Goodwill protection awareness
- Technical skills for role-specific requirements

**Assessment Methods:**
- Written examinations
- Practical demonstrations
- Performance evaluations
- Continuing education verification

### 10.3 Training Records
**Record Requirements:**
- Training content and objectives
- Training dates and duration
- Trainer qualifications
- Trainee attendance and completion
- Competency assessment results
- Training effectiveness evaluation

---

## 11. Inspection and Audit Procedures

### 11.1 Internal Audit Program
**Audit Frequency:** Annual comprehensive audit
**Audit Scope:** All quality system elements
**Audit Team:** Qualified internal auditors
**Audit Reports:** Documented findings and corrective actions

### 11.2 FDA Inspection Preparation
**Inspection Readiness:**
- Current documentation availability
- Staff training and awareness
- Quality system implementation verification
- Personal Goodwill protection documentation
- Risk management file completeness

**Inspection Response:**
- Designated inspection coordinator
- Document request response procedures
- Interview preparation and coordination
- Observation response and corrective action planning

### 11.3 Supplier Audit Program
**Supplier Evaluation:**
- Quality system assessment
- Regulatory compliance verification
- Risk assessment for critical suppliers
- Personal Goodwill impact evaluation

**Audit Frequency:**
- Critical suppliers: Annual
- High-risk suppliers: Biennial
- Other suppliers: As needed based on performance

---

## 12. Corrective and Preventive Actions

### 12.1 Non-Conformance Management
**Identification:** All non-conformances must be documented
**Investigation:** Root cause analysis required for all non-conformances
**Correction:** Immediate correction of non-conforming product/process
**Corrective Action:** Systematic action to prevent recurrence

### 12.2 CAPA Process
**Trigger Events:**
- Non-conforming product
- Customer complaints
- Internal audit findings
- External audit findings
- Risk management file updates
- Personal Goodwill protection issues

**Investigation Requirements:**
- Root cause analysis
- Impact assessment on device safety and effectiveness
- Personal Goodwill protection impact evaluation
- Risk assessment for proposed actions

**Action Planning:**
- Corrective action identification
- Preventive action identification
- Implementation timeline
- Resource requirements
- Effectiveness verification plan

### 12.3 Effectiveness Verification
**Verification Methods:**
- Follow-up audits
- Monitoring of relevant metrics
- Customer feedback analysis
- Personal Goodwill protection verification
- Risk reduction effectiveness assessment

---

## 13. Post-Market Surveillance

### 13.1 Surveillance Activities
**Complaint Handling:**
- Complaint intake and evaluation
- Investigation and root cause analysis
- Risk assessment and classification
- Corrective action implementation
- Trend analysis and reporting

**Field Safety Corrective Actions:**
- Field action identification and evaluation
- Risk-benefit analysis
- Regulatory reporting requirements
- Customer notification procedures
- Effectiveness verification

### 13.2 Post-Market Clinical Follow-up
**Data Collection:**
- Clinical performance data
- User satisfaction feedback
- Adverse event monitoring
- Device reliability assessment
- Personal Goodwill impact monitoring

**Data Analysis:**
- Trend analysis and evaluation
- Risk-benefit reassessment
- Device improvement identification
- Regulatory requirement updates
- Personal Goodwill protection effectiveness

### 13.3 Regulatory Reporting
**Required Reports:**
- Medical Device Reports (MDR) for adverse events
- Annual reports to FDA
- Device registration and listing updates
- 510(k) supplements (if applicable)
- Personal Goodwill protection status reports

---

## 14. Appendices

### Appendix A: Regulatory References
- 21 CFR Part 820 - Quality System Regulation
- 21 CFR § 890.3710 - Powered Communication Systems
- ISO 13485:2016 - Medical Devices Quality Management
- ISO 14971:2019 - Risk Management
- IEC 62304:2006 - Medical Device Software
- NIST PQC Standards - Post-Quantum Cryptography

### Appendix B: Document Templates
- Design Plan Template
- Risk Analysis Template
- Design Review Template
- CAPA Form Template
- Audit Report Template

### Appendix C: Training Matrix
- Role-specific training requirements
- Competency assessment criteria
- Training frequency and content
- Documentation requirements

### Appendix D: Contact Information
- Quality Management Representative
- Medical Device Compliance Officer
- Risk Management Lead
- Regulatory Affairs Contact
- Personal Goodwill Protection Officer

### Appendix E: Personal Goodwill Protection Checklist
- Asset protection strategy implementation
- Legal documentation maintenance
- Regulatory compliance verification
- Risk assessment and monitoring
- Training and awareness verification

---

**Document Control:**
- **Document Number:** P31-MDCM-001
- **Revision:** 1.0
- **Effective Date:** March 24, 2026
- **Next Review Date:** March 24, 2027
- **Approved By:** [Quality Management Representative Name]

**Distribution:**
- Quality Management Representative
- Medical Device Compliance Officer
- Risk Management Lead
- All Quality System Personnel
- Board of Directors (Summary)

**Confidentiality:** This document contains proprietary information and should be handled in accordance with P31 Labs' confidentiality policies and Personal Goodwill protection requirements.