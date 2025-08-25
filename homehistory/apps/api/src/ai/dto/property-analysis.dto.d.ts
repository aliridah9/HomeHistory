export declare class PropertyAnalysisDto {
    propertyId: string;
    analysisType: 'summary' | 'valuation' | 'risk' | 'investment' | 'market';
    includeComparables?: boolean;
    includeMarketTrends?: boolean;
    includeRiskFactors?: boolean;
    customPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}
//# sourceMappingURL=property-analysis.dto.d.ts.map
