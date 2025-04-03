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
  private documents: string[] = [];
  private embeddings: DocumentEmbedding[] = [];
  private termFrequency: { [key: string]: number } = {};
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

  private updateFrequencies(tokens: string[]) {
    // Actualizar frecuencia de términos
    tokens.forEach(token => {
      this.termFrequency[token] = (this.termFrequency[token] || 0) + 1;
    });

    // Actualizar frecuencia de documentos
    new Set(tokens).forEach(token => {
      this.documentFrequency[token] = (this.documentFrequency[token] || 0) + 1;
    });
  }

  public async addDocument(content: string, filename: string): Promise<DocumentEmbedding> {
    const document: DocumentEmbedding = {
      id: crypto.randomUUID(),
      content,
      metadata: { filename, timestamp: new Date() },
      tfidf: {}
    };

    const tokens = this.tokenize(content);
    this.documents.push(content);
    this.updateFrequencies(tokens);

    // Calcular TF-IDF para este documento
    const N = this.documents.length;
    tokens.forEach(token => {
      const tf = this.termFrequency[token] / tokens.length;
      const idf = Math.log(N / this.documentFrequency[token]);
      document.tfidf[token] = tf * idf;
    });

    this.embeddings.push(document);
    return document;
  }

  public async search(query: string): Promise<DocumentEmbedding | null> {
    if (this.embeddings.length === 0) return null;

    const queryTokens = this.tokenize(query);
    const queryTfidf: { [key: string]: number } = {};

    // Calcular TF-IDF para la consulta
    queryTokens.forEach(token => {
      const tf = this.termFrequency[token] / queryTokens.length;
      const idf = Math.log(this.documents.length / this.documentFrequency[token]);
      queryTfidf[token] = tf * idf;
    });

    // Calcular similitud con cada documento y obtener el más relevante
    const result = this.embeddings.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(doc.tfidf, queryTfidf)
    }))
    .sort((a, b) => b.similarity - a.similarity)[0];

    return result;
  }

  private cosineSimilarity(doc1: { [key: string]: number }, doc2: { [key: string]: number }): number {
    const terms = new Set([...Object.keys(doc1), ...Object.keys(doc2)]);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    terms.forEach(term => {
      const val1 = doc1[term] || 0;
      const val2 = doc2[term] || 0;
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    return dotProduct / (magnitude1 * magnitude2);
  }

  public getEmbeddings(): DocumentEmbedding[] {
    return this.embeddings;
  }

  public clearEmbeddings() {
    this.embeddings = [];
    this.documents = [];
    this.termFrequency = {};
    this.documentFrequency = {};
  }
}
