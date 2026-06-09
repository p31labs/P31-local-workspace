#!/usr/bin/env python3
"""
P31 Surrogate Backend - Continuous RAG Ingestion Pipeline
========================================================

Implements continuous RAG ingestion for episodic learning:
- Real-time document processing
- Vector embedding generation
- Semantic memory storage
- Automatic chunking and indexing

Author: P31 Labs
License: MIT
"""

import os
import time
import json
import logging
import asyncio
import re
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def sanitize_input(text: str) -> str:
    """
    Sanitize input text to prevent RAG vector poisoning.
    Removes potential prompt injections and harmful content.
    """
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Remove common prompt injection patterns
    injection_patterns = [
        r'ignore previous instructions',
        r'ignore all previous rules',
        r'disregard previous',
        r'override system',
        r'\[SYSTEM\]',
        r'\[INST\]',
        r'\[SYS\]',
        r'you are now',
        r'pretend to be',
        r'act as if',
        r'new instructions:',
        r'override your',
    ]
    
    for pattern in injection_patterns:
        text = re.sub(pattern, '[FILTERED]', text, flags=re.IGNORECASE)
    
    # Normalize excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

class RAGIngestionWorker:
    """Continuous RAG ingestion pipeline for episodic learning"""
    
    def __init__(self):
        # Configuration
        self.chunk_size = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
        self.overlap_size = int(os.getenv("RAG_OVERLAP_SIZE", "200"))
        self.vector_db_path = os.getenv("VECTOR_DB_PATH", "./data/vector_embeddings")
        
        # Initialize components
        self.encoder = self._initialize_encoder()
        self.vector_db = self._initialize_vector_db()
        self.watch_directories = self._get_watch_directories()
        
        # Processing state
        self.processed_files = set()
        self.is_running = False
        
        logger.info("📚 RAG Ingestion Worker Initialized")
        logger.info(f"📄 Chunk Size: {self.chunk_size}")
        logger.info(f"🔄 Overlap Size: {self.overlap_size}")
        logger.info(f"💾 Vector DB Path: {self.vector_db_path}")
        logger.info(f"👀 Watch Directories: {self.watch_directories}")

    def _initialize_encoder(self) -> SentenceTransformer:
        """Initialize sentence transformer for embeddings"""
        try:
            # Use a lightweight model for local processing
            model_name = "all-MiniLM-L6-v2"
            encoder = SentenceTransformer(model_name)
            logger.info(f"🧠 Encoder Initialized: {model_name}")
            return encoder
        except Exception as e:
            logger.error(f"❌ Encoder initialization failed: {e}")
            raise

    def _initialize_vector_db(self) -> chromadb.Client:
        """Initialize ChromaDB for vector storage"""
        try:
            # Create vector database client
            client = chromadb.Client(Settings(
                chroma_db_impl="sqlite",
                persist_directory=self.vector_db_path
            ))
            
            # Create or get collection
            collection = client.get_or_create_collection(
                name="episodic_memory",
                metadata={"description": "P31 Surrogate Episodic Memory Collection"}
            )
            
            logger.info(f"💾 Vector Database Initialized: {self.vector_db_path}")
            return client
            
        except Exception as e:
            logger.error(f"❌ Vector DB initialization failed: {e}")
            raise

    def _get_watch_directories(self) -> List[str]:
        """Get directories to watch for new documents"""
        # Default directories for different document types
        default_dirs = [
            "./data/documents",
            "./data/transcripts", 
            "./data/notes",
            "./data/research"
        ]
        
        # Allow override via environment variable
        env_dirs = os.getenv("RAG_WATCH_DIRS", "")
        if env_dirs:
            return [d.strip() for d in env_dirs.split(",")]
        
        return default_dirs

    def extract_text_from_file(self, file_path: str) -> str:
        """
        Extract text content from various file formats
        
        Args:
            file_path (str): Path to the file
            
        Returns:
            str: Extracted and sanitized text content
        """
        try:
            file_path = Path(file_path)
            suffix = file_path.suffix.lower()
            
            if suffix in ['.txt', '.md']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    raw_text = f.read()
                    return sanitize_input(raw_text)
            
            elif suffix in ['.pdf']:
                # Simple PDF text extraction (would use pdfplumber in production)
                with open(file_path, 'rb') as f:
                    content = f.read()
                    # Basic text extraction - in production use proper PDF library
                    return sanitize_input(content.decode('utf-8', errors='ignore'))
            
            elif suffix in ['.docx']:
                # Would use python-docx in production
                with open(file_path, 'rb') as f:
                    content = f.read()
                    return sanitize_input(content.decode('utf-8', errors='ignore'))
            
            else:
                logger.warning(f"⚠️  Unsupported file format: {suffix}")
                return ""
                
        except Exception as e:
            logger.error(f"❌ Failed to extract text from {file_path}: {e}")
            return ""

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Chunk text into overlapping segments for better semantic indexing
        
        Args:
            text (str): Input text to chunk
            
        Returns:
            List[Dict[str, Any]]: List of text chunks with metadata
        """
        if not text:
            return []
            
        chunks = []
        text_length = len(text)
        
        # Simple sliding window chunking
        start = 0
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            chunk_text = text[start:end]
            
            # Create chunk metadata
            chunk = {
                "text": chunk_text,
                "start_pos": start,
                "end_pos": end,
                "chunk_id": f"chunk_{start}_{end}",
                "timestamp": time.time(),
                "source_type": "document"
            }
            
            chunks.append(chunk)
            
            # Move to next chunk with overlap
            if end >= text_length:
                break
            start = max(end - self.overlap_size, start + 1)
        
        logger.info(f"📄 Created {len(chunks)} chunks from text")
        return chunks

    def generate_embeddings(self, chunks: List[Dict[str, Any]]) -> List[List[float]]:
        """
        Generate embeddings for text chunks
        
        Args:
            chunks (List[Dict[str, Any]]): List of text chunks
            
        Returns:
            List[List[float]]: List of embedding vectors
        """
        try:
            texts = [chunk["text"] for chunk in chunks]
            embeddings = self.encoder.encode(texts, convert_to_numpy=True)
            
            logger.info(f"🧠 Generated embeddings for {len(chunks)} chunks")
            return embeddings.tolist()
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            return []

    def store_in_vector_db(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> bool:
        """
        Store chunks and embeddings in vector database
        
        Args:
            chunks (List[Dict[str, Any]]): List of text chunks
            embeddings (List[List[float]]): List of embedding vectors
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if not chunks or not embeddings:
                logger.warning("⚠️  No chunks or embeddings to store")
                return False
            
            # Prepare data for ChromaDB
            ids = [chunk["chunk_id"] for chunk in chunks]
            documents = [chunk["text"] for chunk in chunks]
            metadatas = [
                {
                    "start_pos": chunk["start_pos"],
                    "end_pos": chunk["end_pos"],
                    "timestamp": chunk["timestamp"],
                    "source_type": chunk["source_type"]
                }
                for chunk in chunks
            ]
            
            # Get collection
            collection = self.vector_db.get_collection("episodic_memory")
            
            # Add to collection
            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"💾 Stored {len(chunks)} chunks in vector database")
            return True
            
        except Exception as e:
            logger.error(f"❌ Vector DB storage failed: {e}")
            return False

    def ingest_file(self, file_path: str) -> Dict[str, Any]:
        """
        Process a single file through the RAG pipeline
        
        Args:
            file_path (str): Path to the file to ingest
            
        Returns:
            Dict[str, Any]: Processing result
        """
        try:
            start_time = time.time()
            
            # Extract text
            text = self.extract_text_from_file(file_path)
            if not text:
                return {"status": "failed", "reason": "No text extracted", "file": file_path}
            
            # Chunk text
            chunks = self.chunk_text(text)
            if not chunks:
                return {"status": "failed", "reason": "No chunks created", "file": file_path}
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            if not embeddings:
                return {"status": "failed", "reason": "No embeddings generated", "file": file_path}
            
            # Store in vector database
            success = self.store_in_vector_db(chunks, embeddings)
            
            processing_time = time.time() - start_time
            
            result = {
                "status": "success" if success else "failed",
                "file": file_path,
                "chunks_created": len(chunks),
                "processing_time": processing_time,
                "timestamp": time.time()
            }
            
            logger.info(f"📚 Ingested {file_path}: {len(chunks)} chunks in {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ File ingestion failed for {file_path}: {e}")
            return {"status": "failed", "error": str(e), "file": file_path}

    def scan_and_ingest(self) -> Dict[str, Any]:
        """
        Scan watch directories and ingest new files
        
        Returns:
            Dict[str, Any]: Scan and ingestion results
        """
        try:
            new_files = []
            
            # Scan all watch directories
            for directory in self.watch_directories:
                dir_path = Path(directory)
                if not dir_path.exists():
                    logger.warning(f"⚠️  Watch directory does not exist: {directory}")
                    continue
                
                # Find all supported files
                for file_path in dir_path.rglob("*"):
                    if file_path.is_file() and file_path not in self.processed_files:
                        new_files.append(str(file_path))
            
            # Process new files
            results = []
            for file_path in new_files:
                result = self.ingest_file(file_path)
                results.append(result)
                
                if result["status"] == "success":
                    self.processed_files.add(file_path)
            
            return {
                "scanned_files": len(new_files),
                "processed_files": len(results),
                "successful_ingests": sum(1 for r in results if r["status"] == "success"),
                "failed_ingests": sum(1 for r in results if r["status"] == "failed"),
                "results": results,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Scan and ingest failed: {e}")
            return {"status": "failed", "error": str(e)}

    async def continuous_ingestion_loop(self) -> None:
        """Main continuous ingestion loop"""
        logger.info("🔄 Starting continuous RAG ingestion loop...")
        self.is_running = True
        
        while self.is_running:
            try:
                # Perform scan and ingest
                result = self.scan_and_ingest()
                
                if result.get("scanned_files", 0) > 0:
                    logger.info(f"📊 Scan Results: {result['scanned_files']} files, {result['successful_ingests']} successful")
                
                # Wait before next scan
                await asyncio.sleep(30)  # Scan every 30 seconds
                
            except KeyboardInterrupt:
                logger.info("🛑 Continuous ingestion stopped by user")
                self.is_running = False
                break
            except Exception as e:
                logger.error(f"❌ Continuous ingestion error: {e}")
                await asyncio.sleep(5)  # Brief delay before retry

    def search_similar(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar content in the vector database
        
        Args:
            query (str): Search query
            top_k (int): Number of results to return
            
        Returns:
            List[Dict[str, Any]]: Search results
        """
        try:
            # Generate query embedding
            query_embedding = self.encoder.encode([query], convert_to_numpy=True)
            
            # Get collection
            collection = self.vector_db.get_collection("episodic_memory")
            
            # Perform similarity search
            results = collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=top_k,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            for i, doc in enumerate(results["documents"][0]):
                formatted_results.append({
                    "document": doc,
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i],
                    "similarity": 1.0 - results["distances"][0][i]  # Convert distance to similarity
                })
            
            logger.info(f"🔍 Search completed: {len(formatted_results)} results for '{query[:50]}...'")
            return formatted_results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []

    def get_vector_db_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector database"""
        try:
            collection = self.vector_db.get_collection("episodic_memory")
            count = collection.count()
            
            return {
                "status": "healthy",
                "total_documents": count,
                "chunk_size": self.chunk_size,
                "overlap_size": self.overlap_size,
                "watch_directories": self.watch_directories,
                "processed_files": len(self.processed_files)
            }
            
        except Exception as e:
            logger.error(f"❌ Vector DB stats failed: {e}")
            return {"status": "error", "error": str(e)}

    def stop(self) -> None:
        """Stop the continuous ingestion loop"""
        self.is_running = False
        logger.info("🛑 RAG Ingestion Worker Stopped")

def main():
    """Main entry point for testing RAG worker"""
    logger.info("📚 Initializing P31 RAG Ingestion Worker...")
    
    try:
        worker = RAGIngestionWorker()
        
        # Test vector DB stats
        stats = worker.get_vector_db_stats()
        logger.info(f"📊 Vector DB Stats: {stats}")
        
        # Test search (with empty database)
        search_results = worker.search_similar("test query", top_k=3)
        logger.info(f"🔍 Test Search: {len(search_results)} results")
        
        logger.info("✅ RAG Ingestion Worker Ready")
        logger.info("💡 Start continuous ingestion with: python rag_worker.py --continuous")
        
    except Exception as e:
        logger.error(f"💥 RAG Worker failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        # Start continuous ingestion
        worker = RAGIngestionWorker()
        try:
            asyncio.run(worker.continuous_ingestion_loop())
        except KeyboardInterrupt:
            worker.stop()
    else:
        # Just test initialization
        main()