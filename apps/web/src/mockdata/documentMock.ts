export interface DocumentMock {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  pageCount: number;
  category: "ai" | "frontend" | "backend" | "system-design" | "database";
}

export const MOCK_DOCUMENTS: DocumentMock[] = [
  {
    id: "doc-1",
    title: "System Design Fundamentals",
    subtitle:
      "Scalable architecture, load balancing, caching strategies, and real-world distributed system patterns.",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
    pageCount: 180,
    category: "system-design",
  },
  {
    id: "doc-2",
    title: "React Advanced Patterns",
    subtitle:
      "Hooks architecture, composition patterns, performance optimization, and state management strategies.",
    coverImage: "https://images.unsplash.com/photo-1581276879432-15e50529f34b",
    pageCount: 95,
    category: "frontend",
  },
  {
    id: "doc-3",
    title: "AI & Machine Learning Basics",
    subtitle:
      "Introduction to neural networks, embeddings, transformers, and practical AI applications in modern systems.",
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    pageCount: 220,
    category: "ai",
  },
  {
    id: "doc-4",
    title: "Database Design Principles",
    subtitle:
      "Normalization, indexing strategies, SQL vs NoSQL tradeoffs, and high-performance database architecture.",
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
    pageCount: 140,
    category: "database",
  },
  {
    id: "doc-5",
    title: "Frontend Architecture Guide",
    subtitle:
      "Scalable folder structures, state management, API layer design, and component-driven architecture.",
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d",
    pageCount: 110,
    category: "frontend",
  },
  {
    id: "doc-6",
    title: "Backend Engineering Deep Dive",
    subtitle:
      "REST APIs, microservices, authentication systems, caching layers, and system reliability principles.",
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31",
    pageCount: 160,
    category: "backend",
  },
];
