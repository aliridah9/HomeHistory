import { ConfigService } from '@nestjs/config';
export declare class OpenAIService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    generateText(prompt: string, maxTokens?: number): Promise<string>;
    generateReportContent(template: string, data: Record<string, any>): Promise<string>;
    analyzePropertyData(propertyData: Record<string, any>): Promise<string>;
    generateInsights(data: Record<string, any>): Promise<string>;
    private buildReportPrompt;
    private buildAnalysisPrompt;
    private buildInsightsPrompt;
    private generateMockResponse;
    private generateMockReportContent;
    private generateMockAnalysis;
    private generateMockInsights;
}
//# sourceMappingURL=openai.service.d.ts.map
