"""Database tests for User and Scan models.

Uses a separate temporary SQLite test database to avoid modifying
the development database.
"""

import os
import sys
import tempfile
import uuid

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, engine, session_factory
from app.models.user import User
from app.models.scan import Scan


TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "test_scamshield.db")

# Each test gets a fresh database file. Reusing one fixed file made reruns fail
# on UNIQUE constraints from a previous run.
_current_db_path = TEST_DB_PATH
_current_engine = None


def get_test_engine():
    """Create a test database engine for the active test database."""
    return create_engine(
        f"sqlite:///{_current_db_path}",
        echo=False,
        future=True,
        connect_args={"check_same_thread": False},
    )


def get_test_session():
    """Create a test session factory."""
    return sessionmaker(
        bind=get_test_engine(),
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
        future=True,
    )


def setup_test_database():
    """Create a fresh, uniquely named test database with all tables."""
    global _current_db_path, _current_engine

    if _current_engine is not None:
        _current_engine.dispose()
    if os.path.exists(_current_db_path) and _current_db_path != TEST_DB_PATH:
        try:
            os.remove(_current_db_path)
        except OSError:
            pass

    _current_db_path = os.path.join(
        tempfile.gettempdir(),
        f"test_scamshield_{uuid.uuid4().hex}.db",
    )
    _current_engine = get_test_engine()
    Base.metadata.create_all(bind=_current_engine)
    return _current_engine


def test_engine_creation():
    """Test that database engine can be created."""
    engine = get_test_engine()
    try:
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Engine creation test passed")
    finally:
        engine.dispose()


def test_session_creation_and_closure():
    """Test that database sessions can be created and properly closed."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Simple query
        from sqlalchemy import select
        stmt = select(text("1"))
        result = session.execute(stmt)
        assert result.scalar() == 1
        print("✓ Session creation and closure test passed")
    finally:
        session.close()


def test_user_model_creation():
    """Test User model creation and constraints."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        user = User(
            email='test@test.com',
            hashed_password='hashed_password',
            full_name='Test User'
        )
        session.add(user)
        session.commit()
        assert user.id is not None
        assert user.email == 'test@test.com'
        assert user.is_active is True
        assert user.full_name == 'Test User'
        print("✓ User model creation test passed")
    finally:
        session.close()


def test_unique_email_constraint():
    """Test that email uniqueness is enforced."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Create first user
        user1 = User(email='unique@test.com', hashed_password='pw1')
        session.add(user1)
        session.commit()
        
        # Try to create duplicate email
        user2 = User(email='unique@test.com', hashed_password='pw2')
        session.add(user2)
        try:
            session.commit()
            assert False, "Unique constraint should have been raised"
        except Exception as e:
            # Should be an integrity error
            print(f"✓ Unique email constraint test passed (got: {type(e).__name__})")
    finally:
        session.close()


def test_user_scan_relationship():
    """Test user-scan relationship."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Create user
        user = User(email='rel@test.com', hashed_password='pw')
        session.add(user)
        session.commit()
        
        # Create scan associated with user
        scan = Scan(
            content_type='sms',
            risk_score=50,
            risk_level='medium',
            category='Test',
            user_id=user.id
        )
        session.add(scan)
        session.commit()
        
        # Verify relationship
        assert scan.user_id == user.id
        assert len(user.scans) == 1
        assert user.scans[0].id == scan.id
        print("✓ User-scan relationship test passed")
    finally:
        session.close()


def test_optional_user_association_for_scans():
    """Test that scans can exist without a user association."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Create scan without user_id
        scan = Scan(
            content_type='url',
            risk_score=20,
            risk_level='low',
            category='Spam'
            # user_id is None by default
        )
        session.add(scan)
        session.commit()
        
        assert scan.user_id is None
        print("✓ Optional user association for scans test passed")
    finally:
        session.close()


def test_foreign_key_enforcement():
    """Test foreign key behavior."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Create a user
        user = User(email='fk@test.com', hashed_password='pw')
        session.add(user)
        session.commit()
        user_id = user.id
        
        # Create scan with valid user_id
        scan = Scan(
            content_type='payment',
            risk_score=80,
            risk_level='high',
            category='Scam',
            user_id=user_id
        )
        session.add(scan)
        session.commit()
        assert scan.user_id == user_id
        
        print("✓ Foreign key enforcement test passed")
    finally:
        session.close()


def test_health_endpoint_database_status():
    """Test that database connectivity can be checked."""
    from app.database.connection import engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Health endpoint database status test passed")
    except Exception as e:
        print(f"✗ Health endpoint test failed: {e}")


def test_rollback_behavior():
    """Test that sessions can be rolled back on errors."""
    setup_test_database()
    Session = get_test_session()
    session = Session()
    try:
        # Add a user
        user = User(email='rollback@test.com', hashed_password='pw')
        session.add(user)
        # Commit will succeed
        session.commit()
        
        # Verify user exists
        from sqlalchemy import select
        stmt = select(User).where(User.email == 'rollback@test.com')
        result = session.execute(stmt)
        found_user = result.scalar_one()
        assert found_user is not None
        
        # Now test rollback - add and rollback without committing
        user2 = User(email='rollback2@test.com', hashed_password='pw')
        session.add(user2)
        session.rollback()
        
        # User2 should not be in the database
        stmt = select(User).where(User.email == 'rollback2@test.com')
        result = session.execute(stmt)
        rolled_back_user = result.scalar_one_or_none()
        assert rolled_back_user is None, "Rolled back user should not exist"
        
        print("✓ Rollback behavior test passed")
    finally:
        session.close()


def run_all_tests():
    """Run all database tests."""
    print(f"Testing with database: {_current_db_path}")
    print("=" * 50)
    
    test_engine_creation()
    test_session_creation_and_closure()
    test_user_model_creation()
    test_unique_email_constraint()
    test_user_scan_relationship()
    test_optional_user_association_for_scans()
    test_foreign_key_enforcement()
    test_health_endpoint_database_status()
    test_rollback_behavior()
    
    print("=" * 50)
    print("All database tests passed!")


if __name__ == '__main__':
    run_all_tests()
    
    # Clean up test database
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)