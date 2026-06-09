#!/usr/bin/env python3
"""
P31 Surrogate Backend - Semantic Routing Mesh
============================================

Implements 4-Axis Routing Topology based on barycentric coordinates:
- Governance/Identity -> Claude 3.5 Sonnet
- Health/Somatic -> Claude 3.5 Sonnet  
- Legal/Forensic -> Claude 3.5 Sonnet
- Technical/Deterministic -> DeepSeek Coder

Author: P31 Labs
License: MIT
"""

import os
import logging
from typing import Dict, Any, Optional, List
from semantic_router import Route, RouteLayer
from semantic_router.encoders import OpenAIEncoder

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SemanticMesh:
    """Semantic routing system with 4-axis topology"""
    
    def __init__(self):
        # Force encoder to target local proxy for Reference Frame Independence
        os.environ["OPENAI_BASE_URL"] = "http://localhost:4000/v1"
        os.environ["OPENAI_API_KEY"] = "sk-local-proxy-key"
        
        # Initialize encoder
        self.encoder = OpenAIEncoder()
        
        # Define 4-Axis Routing Topology
        self.routes = self._create_routes()
        
        # Initialize route layer
        self.route_layer = RouteLayer(encoder=self.encoder, routes=self.routes)
        
        # Model mapping
        self.model_mapping = {
            "governance_identity": "claude-3-5-sonnet",
            "health_somatic": "claude-3-5-sonnet", 
            "legal_forensic": "claude-3-5-sonnet",
            "technical_deterministic": "deepseek-coder"
        }
        
        logger.info("🌐 Semantic Mesh Initialized")
        logger.info(f"📡 Local Proxy: {os.environ['OPENAI_BASE_URL']}")
        logger.info(f"🔑 API Key: {os.environ['OPENAI_API_KEY']}")
        logger.info(f"🔀 Routes: {len(self.routes)}")

    def _create_routes(self) -> List[Route]:
        """Create the 4-axis routing topology"""
        
        # Governance/Identity Route
        governance_route = Route(
            name="governance_identity",
            utterances=[
                "smart contract deployment",
                "DAO abdication", 
                "multisig execution",
                "governance proposal",
                "voting mechanism",
                "identity verification",
                "access control",
                "permission management",
                "policy enforcement",
                "compliance check"
            ]
        )
        
        # Health/Somatic Route
        health_route = Route(
            name="health_somatic",
            utterances=[
                "metabolic spoon depletion",
                "serum calcium",
                "sensory overload",
                "autonomic regulation",
                "biometric monitoring",
                "neurodivergent health",
                "somatic feedback",
                "physiological state",
                "stress response",
                "energy management"
            ]
        )
        
        # Legal/Forensic Route
        legal_route = Route(
            name="legal_forensic",
            utterances=[
                "court filing",
                "evidentiary logging",
                "subpoena",
                "legal compliance",
                "forensic analysis",
                "document authentication",
                "chain of custody",
                "legal precedent",
                "jurisdictional analysis",
                "regulatory framework"
            ]
        )
        
        # Technical/Deterministic Route
        technical_route = Route(
            name="technical_deterministic",
            utterances=[
                "firmware compilation",
                "backend script",
                "deterministic logic",
                "algorithm implementation",
                "code optimization",
                "system architecture",
                "database design",
                "API development",
                "security protocol",
                "performance tuning"
            ]
        )
        
        routes = [governance_route, health_route, legal_route, technical_route]
        
        logger.info("🗺️  Created 4-Axis Routing Topology:")
        for route in routes:
            logger.info(f"  📍 {route.name}: {len(route.utterances)} utterances")
            
        return routes

    def route_query(self, query: str) -> str:
        """
        Route query to appropriate model based on semantic analysis
        
        Args:
            query (str): Input query to route
            
        Returns:
            str: Target model endpoint
        """
        try:
            # Perform semantic routing
            match = self.route_layer(query)
            
            if match and match.name in self.model_mapping:
                target_model = self.model_mapping[match.name]
                confidence = getattr(match, 'score', 0.0)
                
                logger.info(f"🔀 Routing: '{query[:50]}...' -> {target_model} (confidence: {confidence:.2f})")
                return target_model
            else:
                # Fallback to default model
                fallback_model = "claude-3-5-sonnet"
                logger.warning(f"⚠️  No route match for '{query[:50]}...', using fallback: {fallback_model}")
                return fallback_model
                
        except Exception as e:
            logger.error(f"❌ Routing failed: {e}")
            return "claude-3-5-sonnet"  # Safe fallback

    def get_route_info(self) -> Dict[str, Any]:
        """Get information about current routing configuration"""
        return {
            "routes": [
                {
                    "name": route.name,
                    "utterances_count": len(route.utterances),
                    "model": self.model_mapping.get(route.name, "unknown")
                }
                for route in self.routes
            ],
            "model_mapping": self.model_mapping,
            "encoder": "OpenAI",
            "proxy_url": os.environ.get("OPENAI_BASE_URL", "not set")
        }

    def add_custom_route(self, name: str, utterances: List[str], model: str) -> None:
        """
        Add a custom route to the semantic mesh
        
        Args:
            name (str): Route name
            utterances (List[str]): List of trigger utterances
            model (str): Target model for this route
        """
        try:
            custom_route = Route(name=name, utterances=utterances)
            self.routes.append(custom_route)
            self.model_mapping[name] = model
            self.route_layer = RouteLayer(encoder=self.encoder, routes=self.routes)
            
            logger.info(f"➕ Added custom route: {name} -> {model}")
            
        except Exception as e:
            logger.error(f"❌ Failed to add custom route: {e}")

    def remove_route(self, name: str) -> bool:
        """
        Remove a route from the semantic mesh
        
        Args:
            name (str): Route name to remove
            
        Returns:
            bool: True if removed, False if not found
        """
        try:
            self.routes = [route for route in self.routes if route.name != name]
            if name in self.model_mapping:
                del self.model_mapping[name]
            self.route_layer = RouteLayer(encoder=self.encoder, routes=self.routes)
            
            logger.info(f"➖ Removed route: {name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to remove route: {e}")
            return False

def main():
    """Main entry point for testing semantic mesh"""
    logger.info("🌐 Initializing P31 Semantic Mesh...")
    
    try:
        mesh = SemanticMesh()
        
        # Test routing with sample queries
        test_queries = [
            "How do I deploy a smart contract?",
            "My calcium levels are low, what should I do?",
            "I need to file a court document",
            "Write a Python script for data processing"
        ]
        
        logger.info("🧪 Testing semantic routing...")
        for query in test_queries:
            model = mesh.route_query(query)
            logger.info(f"  Query: '{query}' -> Model: {model}")
        
        # Show route information
        route_info = mesh.get_route_info()
        logger.info(f"📊 Route Configuration: {len(route_info['routes'])} routes")
        
        logger.info("✅ Semantic Mesh Ready")
        
    except Exception as e:
        logger.error(f"💥 Semantic Mesh failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    main()