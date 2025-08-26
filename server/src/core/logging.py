import logging
import sys
from typing import Dict, Any

from src.core.config import settings


def setup_logging() -> None:
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
        ]
    )
    
    if settings.ENVIRONMENT == "development":
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
        logging.getLogger("selenium").setLevel(logging.WARNING)
    else:
        logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
        logging.getLogger("selenium").setLevel(logging.ERROR)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)