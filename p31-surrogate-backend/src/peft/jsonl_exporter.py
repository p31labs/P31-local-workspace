#!/usr/bin/env python3
"""
P31 Surrogate Backend - RAFT/PEFT Preparation Layer
==================================================

Implements RAFT/PEFT preparation for model fine-tuning:
- JSONL dataset export from scratchpad lessons
- LoRA rank configuration (16)
- Batch size optimization (8)
- Dataset versioning and management

Author: P31 Labs
License: MIT
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RAFTPEFTExporter:
    """RAFT/PEFT preparation layer for model fine-tuning"""
    
    def __init__(self):
        # Configuration
        self.jsonl_export_path = os.getenv("JSONL_EXPORT_PATH", "./data/peft_datasets")
        self.loft_rank = int(os.getenv("LOFT_RANK", "16"))
        self.fine_tuning_batch_size = int(os.getenv("FINE_TUNING_BATCH_SIZE", "8"))
        
        # Dataset management
        self.dataset_version = 1
        self.export_format = "jsonl"
        
        # Ensure export directory exists
        Path(self.jsonl_export_path).mkdir(parents=True, exist_ok=True)
        
        logger.info("🔧 RAFT/PEFT Preparation Layer Initialized")
        logger.info(f"📁 Export Path: {self.jsonl_export_path}")
        logger.info(f"🎯 LoRA Rank: {self.loft_rank}")
        logger.info(f"📦 Batch Size: {self.fine_tuning_batch_size}")
        logger.info(f"📊 Dataset Version: {self.dataset_version}")

    def export_lessons_to_jsonl(self, lessons: List[Dict[str, Any]], 
                              dataset_name: str = "surrogate_behavioral_lessons") -> str:
        """
        Export scratchpad lessons to JSONL format for PEFT training
        
        Args:
            lessons (List[Dict[str, Any]]): List of lessons from scratchpad
            dataset_name (str): Name for the dataset
            
        Returns:
            str: Path to exported JSONL file
        """
        try:
            # Generate timestamp for versioning
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{dataset_name}_v{self.dataset_version}_{timestamp}.jsonl"
            filepath = Path(self.jsonl_export_path) / filename
            
            # Prepare JSONL entries
            jsonl_entries = []
            for lesson in lessons:
                # Extract lesson components
                error_type = lesson.get('error_type', 'UNKNOWN')
                error_description = lesson.get('error_description', '')
                corrective_action = lesson.get('corrective_action', '')
                lesson_learned = lesson.get('lesson_learned', '')
                confidence = lesson.get('confidence_score', 0.8)
                
                # Create training example
                training_example = {
                    "instruction": f"Handle {error_type} error: {error_description}",
                    "input": error_description,
                    "output": f"{corrective_action}\n\nLesson: {lesson_learned}",
                    "metadata": {
                        "error_type": error_type,
                        "confidence": confidence,
                        "source": "scratchpad",
                        "version": self.dataset_version,
                        "timestamp": lesson.get('timestamp', time.time())
                    }
                }
                
                jsonl_entries.append(training_example)
            
            # Write to JSONL file
            with open(filepath, 'w', encoding='utf-8') as f:
                for entry in jsonl_entries:
                    f.write(json.dumps(entry, ensure_ascii=False) + '\n')
            
            logger.info(f"📊 Exported {len(lessons)} lessons to {filepath}")
            logger.info(f"📈 Dataset Statistics:")
            logger.info(f"   - Total Examples: {len(lessons)}")
            logger.info(f"   - Average Confidence: {sum(l.get('confidence_score', 0.8) for l in lessons) / len(lessons):.2f}")
            logger.info(f"   - Error Types: {len(set(l.get('error_type', 'UNKNOWN') for l in lessons))}")
            
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ JSONL export failed: {e}")
            return ""

    def create_peft_config(self, model_name: str = "llama3-local") -> Dict[str, Any]:
        """
        Create PEFT configuration for fine-tuning
        
        Args:
            model_name (str): Base model name
            
        Returns:
            Dict[str, Any]: PEFT configuration
        """
        try:
            peft_config = {
                "model_name": model_name,
                "peft_type": "LORA",
                "target_modules": [
                    "q_proj", "v_proj", "k_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"
                ],
                "r": self.loft_rank,
                "lora_alpha": self.loft_rank * 2,
                "lora_dropout": 0.1,
                "bias": "none",
                "task_type": "CAUSAL_LM",
                "modules_to_save": ["embed_tokens", "lm_head"],
                "inference_mode": False,
                "torch_dtype": "float16",
                "use_dora": False,
                "use_rslora": False,
                "init_lora_weights": True,
                "target_modules_strategy": "all-linear"
            }
            
            # Save config to file
            config_path = Path(self.jsonl_export_path) / f"peft_config_v{self.dataset_version}.json"
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(peft_config, f, indent=2, ensure_ascii=False)
            
            logger.info(f"⚙️  Created PEFT config: {config_path}")
            logger.info(f"🎯 LoRA Configuration:")
            logger.info(f"   - Rank (r): {peft_config['r']}")
            logger.info(f"   - Alpha: {peft_config['lora_alpha']}")
            logger.info(f"   - Dropout: {peft_config['lora_dropout']}")
            logger.info(f"   - Target Modules: {len(peft_config['target_modules'])}")
            
            return peft_config
            
        except Exception as e:
            logger.error(f"❌ PEFT config creation failed: {e}")
            return {}

    def create_training_config(self, dataset_path: str, model_name: str = "llama3-local") -> Dict[str, Any]:
        """
        Create training configuration for fine-tuning
        
        Args:
            dataset_path (str): Path to training dataset
            model_name (str): Base model name
            
        Returns:
            Dict[str, Any]: Training configuration
        """
        try:
            training_config = {
                "model_name": model_name,
                "dataset_path": dataset_path,
                "output_dir": f"./fine_tuned_models/v{self.dataset_version}",
                "batch_size": self.fine_tuning_batch_size,
                "gradient_accumulation_steps": 4,
                "learning_rate": 2e-4,
                "num_train_epochs": 3,
                "warmup_steps": 100,
                "logging_steps": 10,
                "save_steps": 500,
                "evaluation_strategy": "steps",
                "eval_steps": 500,
                "save_total_limit": 3,
                "load_best_model_at_end": True,
                "metric_for_best_model": "eval_loss",
                "greater_is_better": False,
                "fp16": True,
                "dataloader_num_workers": 4,
                "remove_unused_columns": False,
                "push_to_hub": False,
                "hub_model_id": f"p31-surrogate-v{self.dataset_version}",
                "dataset_version": self.dataset_version,
                "created_at": datetime.now().isoformat()
            }
            
            # Save training config
            config_path = Path(self.jsonl_export_path) / f"training_config_v{self.dataset_version}.json"
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(training_config, f, indent=2, ensure_ascii=False)
            
            logger.info(f"📚 Created training config: {config_path}")
            logger.info(f"🎯 Training Configuration:")
            logger.info(f"   - Batch Size: {training_config['batch_size']}")
            logger.info(f"   - Learning Rate: {training_config['learning_rate']}")
            logger.info(f"   - Epochs: {training_config['num_train_epochs']}")
            logger.info(f"   - Gradient Accumulation: {training_config['gradient_accumulation_steps']}")
            
            return training_config
            
        except Exception as e:
            logger.error(f"❌ Training config creation failed: {e}")
            return {}

    def generate_dataset_statistics(self, lessons: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate comprehensive dataset statistics
        
        Args:
            lessons (List[Dict[str, Any]]): List of lessons
            
        Returns:
            Dict[str, Any]: Dataset statistics
        """
        try:
            # Basic statistics
            total_lessons = len(lessons)
            avg_confidence = sum(lesson.get('confidence_score', 0.8) for lesson in lessons) / total_lessons if lessons else 0
            
            # Error type distribution
            error_types = {}
            for lesson in lessons:
                error_type = lesson.get('error_type', 'UNKNOWN')
                error_types[error_type] = error_types.get(error_type, 0) + 1
            
            # Confidence distribution
            confidence_buckets = {"high": 0, "medium": 0, "low": 0}
            for lesson in lessons:
                confidence = lesson.get('confidence_score', 0.8)
                if confidence >= 0.8:
                    confidence_buckets["high"] += 1
                elif confidence >= 0.5:
                    confidence_buckets["medium"] += 1
                else:
                    confidence_buckets["low"] += 1
            
            # Content analysis
            avg_input_length = sum(len(lesson.get('error_description', '')) for lesson in lessons) / total_lessons if lessons else 0
            avg_output_length = sum(len(lesson.get('corrective_action', '') + lesson.get('lesson_learned', '')) for lesson in lessons) / total_lessons if lessons else 0
            
            statistics = {
                "dataset_version": self.dataset_version,
                "total_lessons": total_lessons,
                "avg_confidence": round(avg_confidence, 2),
                "error_type_distribution": error_types,
                "confidence_distribution": confidence_buckets,
                "avg_input_length": round(avg_input_length, 2),
                "avg_output_length": round(avg_output_length, 2),
                "quality_score": self._calculate_quality_score(lessons),
                "generated_at": datetime.now().isoformat()
            }
            
            # Save statistics
            stats_path = Path(self.jsonl_export_path) / f"dataset_stats_v{self.dataset_version}.json"
            with open(stats_path, 'w', encoding='utf-8') as f:
                json.dump(statistics, f, indent=2, ensure_ascii=False)
            
            logger.info(f"📊 Dataset Statistics:")
            logger.info(f"   - Total Lessons: {total_lessons}")
            logger.info(f"   - Average Confidence: {avg_confidence:.2f}")
            logger.info(f"   - Error Types: {len(error_types)}")
            logger.info(f"   - Quality Score: {statistics['quality_score']:.2f}")
            
            return statistics
            
        except Exception as e:
            logger.error(f"❌ Dataset statistics generation failed: {e}")
            return {}

    def _calculate_quality_score(self, lessons: List[Dict[str, Any]]) -> float:
        """Calculate overall dataset quality score"""
        try:
            if not lessons:
                return 0.0
            
            # Quality factors
            confidence_factor = sum(lesson.get('confidence_score', 0.8) for lesson in lessons) / len(lessons)
            
            # Completeness factor (how many required fields are present)
            completeness_scores = []
            for lesson in lessons:
                required_fields = ['error_type', 'error_description', 'corrective_action', 'lesson_learned']
                present_fields = sum(1 for field in required_fields if lesson.get(field))
                completeness_scores.append(present_fields / len(required_fields))
            
            completeness_factor = sum(completeness_scores) / len(completeness_scores)
            
            # Diversity factor (error type variety)
            error_types = set(lesson.get('error_type', 'UNKNOWN') for lesson in lessons)
            diversity_factor = min(len(error_types) / 10.0, 1.0)  # Normalize to 0-1
            
            # Calculate weighted quality score
            quality_score = (confidence_factor * 0.5) + (completeness_factor * 0.3) + (diversity_factor * 0.2)
            
            return round(quality_score, 2)
            
        except Exception as e:
            logger.error(f"❌ Quality score calculation failed: {e}")
            return 0.5

    def export_complete_dataset(self, lessons: List[Dict[str, Any]], 
                              dataset_name: str = "surrogate_behavioral_lessons",
                              model_name: str = "llama3-local") -> Dict[str, Any]:
        """
        Export complete dataset with all necessary configurations
        
        Args:
            lessons (List[Dict[str, Any]]): List of lessons from scratchpad
            dataset_name (str): Name for the dataset
            model_name (str): Base model name
            
        Returns:
            Dict[str, Any]: Export results and paths
        """
        try:
            logger.info("🚀 Starting complete dataset export...")
            
            # Export lessons to JSONL
            dataset_path = self.export_lessons_to_jsonl(lessons, dataset_name)
            if not dataset_path:
                return {"status": "failed", "reason": "JSONL export failed"}
            
            # Create PEFT configuration
            peft_config = self.create_peft_config(model_name)
            if not peft_config:
                return {"status": "failed", "reason": "PEFT config creation failed"}
            
            # Create training configuration
            training_config = self.create_training_config(dataset_path, model_name)
            if not training_config:
                return {"status": "failed", "reason": "Training config creation failed"}
            
            # Generate dataset statistics
            statistics = self.generate_dataset_statistics(lessons)
            
            # Increment dataset version
            self.dataset_version += 1
            
            result = {
                "status": "success",
                "dataset_version": self.dataset_version - 1,
                "export_paths": {
                    "dataset": dataset_path,
                    "peft_config": str(Path(self.jsonl_export_path) / f"peft_config_v{self.dataset_version - 1}.json"),
                    "training_config": str(Path(self.jsonl_export_path) / f"training_config_v{self.dataset_version - 1}.json"),
                    "statistics": str(Path(self.jsonl_export_path) / f"dataset_stats_v{self.dataset_version - 1}.json")
                },
                "configuration": {
                    "loft_rank": self.loft_rank,
                    "batch_size": self.fine_tuning_batch_size,
                    "model_name": model_name
                },
                "statistics": statistics,
                "timestamp": time.time()
            }
            
            logger.info(f"✅ Complete dataset export successful:")
            logger.info(f"   - Dataset: {dataset_path}")
            logger.info(f"   - PEFT Config: {result['export_paths']['peft_config']}")
            logger.info(f"   - Training Config: {result['export_paths']['training_config']}")
            logger.info(f"   - Statistics: {result['export_paths']['statistics']}")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Complete dataset export failed: {e}")
            return {"status": "failed", "error": str(e)}

    def get_export_health(self) -> Dict[str, Any]:
        """Get health status of the export system"""
        try:
            # Check export directory
            export_dir = Path(self.jsonl_export_path)
            if not export_dir.exists():
                return {"status": "error", "reason": "Export directory does not exist"}
            
            # Count existing files
            jsonl_files = list(export_dir.glob("*.jsonl"))
            config_files = list(export_dir.glob("*.json"))
            
            return {
                "status": "healthy",
                "export_directory": str(export_dir),
                "jsonl_files": len(jsonl_files),
                "config_files": len(config_files),
                "loft_rank": self.loft_rank,
                "batch_size": self.fine_tuning_batch_size,
                "current_version": self.dataset_version,
                "timestamp": time.time()
            }
            
        except Exception as e:
            logger.error(f"❌ Export health check failed: {e}")
            return {"status": "error", "error": str(e)}

def main():
    """Main entry point for testing RAFT/PEFT exporter"""
    logger.info("🔧 Initializing P31 RAFT/PEFT Preparation Layer...")
    
    try:
        exporter = RAFTPEFTExporter()
        
        # Test with sample lessons
        sample_lessons = [
            {
                "error_type": "API_TIMEOUT",
                "error_description": "Request to external service timed out after 30 seconds",
                "corrective_action": "Implement retry mechanism with exponential backoff",
                "lesson_learned": "Always implement proper timeout handling and retry logic for external service calls",
                "confidence_score": 0.9,
                "timestamp": time.time()
            },
            {
                "error_type": "INVALID_INPUT",
                "error_description": "User provided malformed JSON data",
                "corrective_action": "Add input validation and sanitization",
                "lesson_learned": "Always validate and sanitize user inputs before processing",
                "confidence_score": 0.85,
                "timestamp": time.time()
            }
        ]
        
        # Test complete export
        result = exporter.export_complete_dataset(sample_lessons)
        logger.info(f"📊 Export Result: {result['status']}")
        
        # Test health check
        health = exporter.get_export_health()
        logger.info(f"🏥 Export Health: {health}")
        
        logger.info("✅ RAFT/PEFT Preparation Layer Ready")
        
    except Exception as e:
        logger.error(f"💥 RAFT/PEFT exporter failed to start: {e}")
        exit(1)

if __name__ == "__main__":
    main()