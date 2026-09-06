# Code Audit Prompt for @p31/shared Implementation

## Audit Request

Please perform a comprehensive code audit of the @p31/shared package implementation. This is a system-wide shared modules package for the P31 Labs ecosystem containing four core vectors: ZUI (3D visualization), Economy (LOVE ledger), Rules (constitution-based engine), and BLE (Web Bluetooth).

## Audit Scope

### 1. **Architecture & Design Patterns**
- Evaluate overall architecture consistency and adherence to the WCD-SE-SDS specification
- Assess design pattern usage (React stores, singleton patterns, factory patterns)
- Check for proper separation of concerns between the four vectors
- Evaluate integration points and dependency management

### 2. **TypeScript Quality**
- Review type safety and completeness
- Check for proper interface definitions and type exports
- Evaluate generic usage and type constraints
- Identify any `any` types that should be properly typed
- Assess enum usage and string literal alternatives

### 3. **Performance & Optimization**
- Analyze performance bottlenecks in Sierpinski mesh generation
- Evaluate memory usage in React stores and state management
- Check for potential memory leaks in event listeners and subscriptions
- Assess BLE scanning performance and RSSI calculation efficiency
- Review camera animation performance and transition handling

### 4. **Security & Safety**
- Evaluate cognitive shield implementation for security vulnerabilities
- Check for potential XSS or injection attacks in message processing
- Assess rule evaluation security and privilege escalation risks
- Review BLE scanning for privacy and security concerns
- Evaluate data validation and sanitization

### 5. **Error Handling & Resilience**
- Review error handling patterns across all modules
- Check for proper fallback mechanisms and graceful degradation
- Assess error recovery strategies for BLE scanning failures
- Evaluate store error states and recovery
- Check for proper cleanup in component unmounting

### 6. **Code Quality & Maintainability**
- Assess code readability and documentation quality
- Check for code duplication and opportunities for refactoring
- Evaluate naming conventions and code organization
- Review comment quality and API documentation
- Assess testability of the codebase

### 7. **Integration & Compatibility**
- Evaluate cross-vector integration patterns
- Check for proper dependency management and circular dependencies
- Assess browser compatibility for Web Bluetooth features
- Review React compatibility and hook usage
- Evaluate TypeScript configuration and build process

### 8. **Business Logic Correctness**
- Verify rule evaluation logic matches specification requirements
- Check LOVE ledger calculations and transaction integrity
- Assess zone transition logic and state management
- Evaluate cognitive shield conflict detection accuracy
- Review mesh generation algorithms for correctness

## Specific Areas of Concern

### BLE Implementation
- Web Bluetooth API usage and experimental feature handling
- RSSI-based distance calculation accuracy
- Event handling and state management
- Memory management for continuous scanning
- Error handling for unsupported browsers

### Rules Engine
- Rule evaluation performance with large rule sets
- Priority-based rule resolution logic
- Context validation and type safety
- Prime directive immutability enforcement
- Creator rule validation and security

### ZUI System
- Sierpinski mesh generation performance
- Camera state management and transitions
- Performance factor adaptation logic
- Memory management for 3D rendering
- React integration patterns

### Economy System
- LOVE value calculation accuracy
- Transaction history integrity
- Telemetry data collection and privacy
- Store state management and updates
- Integration with other vectors

## Deliverables

Please provide:

1. **Executive Summary**: High-level assessment of code quality and readiness
2. **Detailed Findings**: Specific issues categorized by severity (Critical, High, Medium, Low)
3. **Security Assessment**: Security vulnerabilities and recommendations
4. **Performance Analysis**: Performance bottlenecks and optimization opportunities
5. **Architecture Review**: Design pattern effectiveness and architectural improvements
6. **Code Quality Report**: Maintainability, readability, and best practice compliance
7. **Integration Assessment**: Cross-vector integration quality and dependency management
8. **Business Logic Validation**: Correctness of implemented business rules and algorithms
9. **Recommendations**: Prioritized list of improvements with implementation guidance
10. **Risk Assessment**: Potential risks and mitigation strategies

## Evaluation Criteria

- **Security**: Vulnerability assessment and security best practices
- **Performance**: Efficiency, optimization, and resource management
- **Reliability**: Error handling, resilience, and fault tolerance
- **Maintainability**: Code organization, documentation, and testability
- **Scalability**: Ability to handle growth in users, data, and complexity
- **Compliance**: Adherence to TypeScript, React, and Web standards
- **Integration**: Quality of cross-vector integration and dependency management

## Context

This implementation is based on the WCD-SE-SDS specification for Spaceship Earth and must support:
- Neurodivergent accessibility requirements
- Sovereign identity integration
- Real-time environmental nudging
- 3D mesh visualization of zone topology
- Constitution-based rule enforcement
- LOVE token economy system

Please provide actionable recommendations with specific code examples where applicable.