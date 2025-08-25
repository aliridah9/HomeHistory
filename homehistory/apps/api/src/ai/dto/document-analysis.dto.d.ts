export declare class DocumentAnalysisDto {
    documentId: string;
    documentType: 'inspection' | 'appraisal' | 'deed' | 'permit' | 'insurance' | 'other';
    extractionType: 'summary' | 'structured' | 'issues' | 'compliance' | 'full';
    customFields?: string[];
    language?: string;
}
//# sourceMappingURL=document-analysis.dto.d.ts.map
