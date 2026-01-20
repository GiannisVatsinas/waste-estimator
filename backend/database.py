from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Local SQLite database file
SQLALCHEMY_DATABASE_URL = "sqlite:///./waste.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ScanResult(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    filename = Column(String)
    category = Column(String)
    material = Column(String)
    weight = Column(Float)
    confidence = Column(Float)
    actual_weight = Column(Float, nullable=True) # User provided weight
    object_count = Column(Integer, default=1)   # Number of items detected

def init_db():
    Base.metadata.create_all(bind=engine)
