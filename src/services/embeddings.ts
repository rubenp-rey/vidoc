export interface DocumentEmbedding {
  id: string;
  content: string;
  metadata: {
    filename: string;
    timestamp: Date;
  };
  tfidf: { [key: string]: number };
}

export class EmbeddingsService {
  private static instance: EmbeddingsService;
  private documents: DocumentEmbedding[] = [];
  private documentFrequency: { [key: string]: number } = {};

  private constructor() {}

  public static getInstance(): EmbeddingsService {
    if (!EmbeddingsService.instance) {
      EmbeddingsService.instance = new EmbeddingsService();
    }
    return EmbeddingsService.instance;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private computeTF(tokens: string[]): { [key: string]: number } {
    const termCount: { [key: string]: number } = {};
    tokens.forEach(token => {
      termCount[token] = (termCount[token] || 0) + 1;
    });

    // Normalizar TF dividiendo entre el total de términos
    const totalTerms = tokens.length;
    Object.keys(termCount).forEach(term => {
      termCount[term] /= totalTerms;
    });

    return termCount;
  }

  private computeIDF(): { [key: string]: number } {
    const N = this.documents.length;
    const idf: { [key: string]: number } = {};

    Object.keys(this.documentFrequency).forEach(term => {
      idf[term] = Math.log((N + 1) / (this.documentFrequency[term] + 1)) + 1;
    });

    return idf;
  }

  public async addDocument(content: string, filename: string): Promise<DocumentEmbedding> {
    const tokens = this.tokenize(content);
    const tf = this.computeTF(tokens);

    // Actualizar DF
    new Set(tokens).forEach(token => {
      this.documentFrequency[token] = (this.documentFrequency[token] || 0) + 1;
    });

    // Recalcular IDF para todos los documentos
    const idf = this.computeIDF();

    // Calcular TF-IDF para este documento
    const tfidf: { [key: string]: number } = {};
    Object.keys(tf).forEach(term => {
      tfidf[term] = tf[term] * (idf[term] || 0);
    });

    const document: DocumentEmbedding = {
      id: crypto.randomUUID(),
      content,
      metadata: { filename, timestamp: new Date() },
      tfidf
    };

    this.documents.push(document);
    return document;
  }

  public findMostRelevants(query: string): DocumentEmbedding[] {
    const queryTokens = this.tokenize(query);
    const queryTF = this.computeTF(queryTokens);
    const idf = this.computeIDF();
  
    // Calcular TF-IDF de la query
    const queryTFIDF: { [key: string]: number } = {};
    Object.keys(queryTF).forEach(term => {
      queryTFIDF[term] = queryTF[term] * (idf[term] || 0);
    });
  
    // Calcular score para cada documento
    const scoredDocs = this.documents.map(doc => {
      const score = this.cosineSimilarity(queryTFIDF, doc.tfidf);
      return { doc, score };
    });
  
    // Ordenar de mayor a menor
    scoredDocs.sort((a, b) => b.score - a.score);
  
    // Devolver solo los documentos (sin el score)
    return scoredDocs.map(item => item.doc);
  }
  

  private cosineSimilarity(vec1: { [key: string]: number }, vec2: { [key: string]: number }): number {
    const terms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    
    let dotProduct = 0;
    let normVec1 = 0;
    let normVec2 = 0;

    terms.forEach(term => {
      const v1 = vec1[term] || 0;
      const v2 = vec2[term] || 0;

      dotProduct += v1 * v2;
      normVec1 += v1 * v1;
      normVec2 += v2 * v2;
    });

    return normVec1 && normVec2 ? dotProduct / (Math.sqrt(normVec1) * Math.sqrt(normVec2)) : 0;
  }
}
