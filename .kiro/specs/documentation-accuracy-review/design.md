# Design Document: Documentation Accuracy Review

## Overview

The Documentation Accuracy Review system validates and corrects documentation files in the docs/ directory against the actual codebase. The system processes files individually, verifying references (file paths, directory structures, code examples) and applying corrections to ensure documentation accurately reflects the current state of the code.

The design follows a file-by-file review approach where each documentation file is:
1. Analyzed to extract all references
2. Verified against the actual codebase structure
3. Corrected to match reality
4. Reported with a summary of changes

Documentation is organized around project entry points and domains, ensuring each file maintains focused coverage of its specific area.

## Architecture

The system follows a pipeline architecture with four main stages:

```
Documentation File → Reference Extraction → Verification → Correction → Report Generation
```

### High-Level Flow

1. **File Selection**: Select next documentation file from docs/ directory
2. **Reference Extraction**: Parse the markdown file and identify all references (paths, structures, examples)
3. **Verification**: Check each reference against the actual codebase using file system operations
4. **Correction Generation**: Create corrected versions of inaccurate content
5. **Report Generation**: Produce a summary of findings and corrections
6. **User Confirmation**: Present report and wait for approval
7. **Application**: Apply approved corrections to the file
8. **Iteration**: Move to next file

### Key Design Decisions

- **Sequential Processing**: Process one file at a time to allow incremental review and approval
- **Non-Destructive Verification**: Read-only operations during verification phase
- **Explicit Confirmation**: Require user approval before applying changes
- **Domain Alignment**: Ensure documentation content aligns with project entry points and domains

## Components and Interfaces

### 1. File Selector

**Responsibility**: Manage the queue of documentation files to review

**Interface**:
```
function getNextFile(): string | null
  // Returns the path to the next documentation file to review
  // Returns null if all files have been processed

function markFileProcessed(filePath: string): void
  // Marks a file as completed

function getProcessedFiles(): string[]
  // Returns list of already processed files

function getRemainingFiles(): string[]
  // Returns list of files still to process
```

**Implementation Notes**:
- Maintains a list of all .md files in docs/
- Tracks which files have been processed
- Provides deterministic ordering (alphabetical by default)

### 2. Reference Extractor

**Responsibility**: Parse markdown files and identify all references that need verification

**Interface**:
```
type Reference = {
  type: 'file_path' | 'directory_structure' | 'code_example' | 'module_reference' | 'component_reference'
  content: string
  location: { line: number, column: number }
  context: string
}

function extractReferences(fileContent: string): Reference[]
  // Parses markdown and returns all references found
```

**Implementation Notes**:
- Identifies file paths in code blocks, inline code, and links
- Detects directory structure descriptions (lists, trees)
- Extracts code examples from fenced code blocks
- Identifies module/component references in prose
- Preserves location information for reporting

### 3. Reference Verifier

**Responsibility**: Check references against the actual codebase

**Interface**:
```
type VerificationResult = {
  reference: Reference
  isValid: boolean
  actualValue?: string
  issue?: string
}

function verifyReference(reference: Reference, codebasePath: string): VerificationResult
  // Verifies a single reference against the codebase

function verifyFilePath(path: string): boolean
  // Checks if a file exists at the given path

function verifyDirectoryStructure(path: string, expectedStructure: string[]): { exists: string[], missing: string[] }
  // Checks which subdirectories exist vs. expected

function verifyCodePattern(codeExample: string, searchPaths: string[]): boolean
  // Checks if code pattern exists in codebase
```

**Implementation Notes**:
- Uses file system operations to check existence
- Compares expected vs. actual directory contents
- Searches for code patterns in relevant files
- Returns detailed information about mismatches

### 4. Correction Generator

**Responsibility**: Generate corrected content for inaccurate references

**Interface**:
```
type Correction = {
  original: string
  corrected: string
  reason: string
  location: { line: number, column: number }
}

function generateCorrections(verificationResults: VerificationResult[]): Correction[]
  // Creates corrections for all invalid references

function correctFilePath(original: string, actualPath: string): string
  // Generates corrected file path

function correctDirectoryStructure(original: string, actualStructure: string[]): string
  // Generates corrected directory structure description

function correctCodeExample(original: string, actualCode: string): string
  // Generates corrected code example
```

**Implementation Notes**:
- Preserves markdown formatting
- Maintains documentation structure
- Provides clear explanations for changes
- Handles multiple correction types

### 5. Report Generator

**Responsibility**: Create human-readable summaries of findings and corrections

**Interface**:
```
type FileReport = {
  filePath: string
  totalReferences: number
  validReferences: number
  invalidReferences: number
  corrections: Correction[]
  recommendation: 'correct' | 'remove' | 'major_rewrite'
  summary: string
}

function generateReport(filePath: string, verificationResults: VerificationResult[], corrections: Correction[]): FileReport
  // Creates comprehensive report for a file

function formatReportForDisplay(report: FileReport): string
  // Formats report as readable markdown
```

**Implementation Notes**:
- Calculates accuracy percentage
- Recommends removal if >80% inaccurate
- Groups corrections by type
- Provides actionable summary

### 6. File Updater

**Responsibility**: Apply approved corrections to documentation files

**Interface**:
```
function applyCorrections(filePath: string, corrections: Correction[]): void
  // Applies all corrections to the file

function removeFile(filePath: string, reason: string): void
  // Removes a file and logs the reason

function backupFile(filePath: string): string
  // Creates backup before modifications
```

**Implementation Notes**:
- Creates backup before changes
- Applies corrections in reverse line order (to preserve locations)
- Validates file integrity after changes
- Logs all modifications

### 7. Domain Analyzer

**Responsibility**: Identify the domain/entry point a documentation file covers

**Interface**:
```
type Domain = {
  name: string
  entryPoints: string[]
  relatedPaths: string[]
}

function identifyDomain(fileContent: string, filePath: string): Domain
  // Determines the domain based on content and file name

function checkDomainAlignment(fileContent: string, expectedDomain: Domain): boolean
  // Verifies content aligns with expected domain

function suggestDomainSplit(fileContent: string): Domain[]
  // Suggests splitting if multiple domains detected
```

**Implementation Notes**:
- Analyzes file name and content
- Identifies primary entry points mentioned
- Detects mixed domains
- Suggests reorganization when needed

## Data Models

### Reference

Represents a verifiable element in documentation:

```typescript
type Reference = {
  type: 'file_path' | 'directory_structure' | 'code_example' | 'module_reference' | 'component_reference'
  content: string
  location: {
    line: number
    column: number
  }
  context: string  // Surrounding text for context
}
```

### VerificationResult

Result of verifying a reference:

```typescript
type VerificationResult = {
  reference: Reference
  isValid: boolean
  actualValue?: string  // What actually exists (if different)
  issue?: string        // Description of the problem
}
```

### Correction

A correction to be applied:

```typescript
type Correction = {
  original: string
  corrected: string
  reason: string
  location: {
    line: number
    column: number
  }
}
```

### FileReport

Summary of a file review:

```typescript
type FileReport = {
  filePath: string
  totalReferences: number
  validReferences: number
  invalidReferences: number
  corrections: Correction[]
  recommendation: 'correct' | 'remove' | 'major_rewrite'
  summary: string
}
```

### Domain

Represents a project domain:

```typescript
type Domain = {
  name: string
  entryPoints: string[]
  relatedPaths: string[]
}
```

### ProcessingState

Tracks overall progress:

```typescript
type ProcessingState = {
  totalFiles: number
  processedFiles: string[]
  remainingFiles: string[]
  currentFile: string | null
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Reference Extraction

*For any* documentation file content, all references (file paths, directory structures, code examples, module references, component references) should be extracted and identified.

**Validates: Requirements 1.2**

### Property 2: Universal Reference Verification

*For any* extracted reference, the system should verify it against the actual codebase and produce a verification result indicating validity.

**Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 7.2, 7.4**

### Property 3: Correction Generation for Invalid References

*For any* invalid reference, the system should generate a correction that includes the original content, corrected content, and reason for the change.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3, 7.5**

### Property 4: Formatting Preservation

*For any* correction applied to a documentation file, the markdown structure and formatting should be preserved (headings, lists, code blocks, links should remain valid markdown).

**Validates: Requirements 3.5**

### Property 5: Accuracy-Based Removal Recommendation

*For any* documentation file where invalid references exceed 80% of total references, the system should recommend removal rather than correction.

**Validates: Requirements 4.3**

### Property 6: Complete Report Generation

*For any* documentation file review, the generated report should include: total reference count, valid reference count, invalid reference count, list of all corrections (with original and corrected content), and a recommendation (correct/remove/major_rewrite).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 7: Report Before Changes

*For any* documentation file processing, the report generation should complete before any corrections are applied to the file.

**Validates: Requirements 5.5**

### Property 8: Sequential File Processing

*For any* set of documentation files, processing should occur one file at a time in a defined order (alphabetical), with each file fully completed before the next begins.

**Validates: Requirements 1.1, 1.4, 6.1**

### Property 9: Processing State Tracking

*For any* documentation review session, the system should maintain an accurate record of which files have been processed and which remain, with no file processed more than once.

**Validates: Requirements 6.5**

### Property 10: Domain Identification

*For any* documentation file, the system should identify at least one domain or entry point that the file covers based on its content and file name.

**Validates: Requirements 8.1**

### Property 11: Domain Alignment Maintenance

*For any* correction made to a documentation file, the corrected content should align with the file's identified domain and not introduce content from unrelated domains.

**Validates: Requirements 8.3, 8.4, 8.5**

### Property 12: Multi-Domain Detection

*For any* documentation file that contains content from multiple unrelated domains, the system should identify this and recommend splitting the file.

**Validates: Requirements 8.2**

### Property 13: Removal Justification

*For any* documentation file marked for removal, the system should provide a justification that includes either: (1) the file describes non-existent features, (2) the file has no corresponding implementation, or (3) the file is more than 80% inaccurate.

**Validates: Requirements 4.1, 4.2, 4.4**

### Property 14: Complete Subdirectory Listing

*For any* module structure description in corrected documentation, all actual subdirectories that exist in that module should be listed, and no non-existent subdirectories should be listed.

**Validates: Requirements 7.1**

## Error Handling

### Reference Extraction Errors

- **Malformed Markdown**: If markdown parsing fails, log the error and skip the file with a report indicating parsing failure
- **Empty Files**: Treat as valid with zero references
- **Binary Files**: Skip with warning (should not be in docs/)

### Verification Errors

- **File System Access Errors**: If codebase path is inaccessible, fail fast with clear error message
- **Permission Errors**: Log and skip verification for inaccessible paths
- **Ambiguous References**: If a reference could match multiple locations, mark as "needs manual review"

### Correction Errors

- **Conflicting Corrections**: If multiple corrections overlap, apply in order and validate result
- **Uncorrectable References**: If no valid correction can be generated, mark as "needs manual review"

### File Update Errors

- **Write Permission Errors**: Fail with clear error, do not proceed to next file
- **Backup Failures**: Fail before attempting corrections
- **Validation Failures**: If corrected file is invalid markdown, restore backup and report error

### Domain Analysis Errors

- **Ambiguous Domain**: If domain cannot be determined, mark as "general" domain
- **Multiple Domains**: Report as finding, recommend split

## Testing Strategy

### Unit Testing

Unit tests will focus on specific examples and edge cases:

- **Reference Extraction**: Test extraction of each reference type (file paths, directory structures, code examples) from sample markdown
- **Verification Logic**: Test file existence checks, directory structure comparisons, code pattern matching with known examples
- **Correction Generation**: Test correction generation for specific known mismatches
- **Report Formatting**: Test report generation with sample data
- **Edge Cases**: Empty files, files with no references, files with only valid references, files with only invalid references
- **Error Conditions**: Malformed markdown, inaccessible paths, permission errors

### Property-Based Testing

Property tests will verify universal properties across all inputs using a minimum of 100 iterations per test:

1. **Property 1 Test**: Generate random markdown content with embedded references, verify all references are extracted
   - **Feature: documentation-accuracy-review, Property 1: Complete Reference Extraction**

2. **Property 2 Test**: Generate random references, verify each produces a verification result
   - **Feature: documentation-accuracy-review, Property 2: Universal Reference Verification**

3. **Property 3 Test**: Generate random invalid references, verify each produces a correction
   - **Feature: documentation-accuracy-review, Property 3: Correction Generation for Invalid References**

4. **Property 4 Test**: Generate random markdown with corrections, verify markdown structure is preserved
   - **Feature: documentation-accuracy-review, Property 4: Formatting Preservation**

5. **Property 5 Test**: Generate random documentation files with varying accuracy percentages, verify removal recommendation when <20% accurate
   - **Feature: documentation-accuracy-review, Property 5: Accuracy-Based Removal Recommendation**

6. **Property 6 Test**: Generate random verification results, verify report contains all required fields
   - **Feature: documentation-accuracy-review, Property 6: Complete Report Generation**

7. **Property 7 Test**: Generate random file processing sequences, verify report generation precedes file modification
   - **Feature: documentation-accuracy-review, Property 7: Report Before Changes**

8. **Property 8 Test**: Generate random sets of files, verify sequential processing in alphabetical order
   - **Feature: documentation-accuracy-review, Property 8: Sequential File Processing**

9. **Property 9 Test**: Generate random processing sessions, verify state tracking is accurate and no duplicates
   - **Feature: documentation-accuracy-review, Property 9: Processing State Tracking**

10. **Property 10 Test**: Generate random documentation files, verify domain identification always succeeds
    - **Feature: documentation-accuracy-review, Property 10: Domain Identification**

11. **Property 11 Test**: Generate random corrections, verify domain alignment is maintained
    - **Feature: documentation-accuracy-review, Property 11: Domain Alignment Maintenance**

12. **Property 12 Test**: Generate random multi-domain files, verify detection and split recommendation
    - **Feature: documentation-accuracy-review, Property 12: Multi-Domain Detection**

13. **Property 13 Test**: Generate random removal recommendations, verify justification is provided
    - **Feature: documentation-accuracy-review, Property 13: Removal Justification**

14. **Property 14 Test**: Generate random module structures, verify corrected descriptions list all and only existing subdirectories
    - **Feature: documentation-accuracy-review, Property 14: Complete Subdirectory Listing**

### Testing Library

For TypeScript/JavaScript implementation, we will use **fast-check** as the property-based testing library. Each property test will be configured to run a minimum of 100 iterations to ensure comprehensive coverage through randomization.

### Dual Testing Approach

Both unit tests and property tests are required and complementary:
- **Unit tests** catch concrete bugs in specific scenarios and edge cases
- **Property tests** verify general correctness across a wide range of inputs
- Together they provide comprehensive coverage of the system's behavior

