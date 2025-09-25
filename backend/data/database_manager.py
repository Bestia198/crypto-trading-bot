from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from backend.data.database_models import Base, Trade, MarketData
from backend.utils.logger import setup_logger
from backend.utils.config import config
from datetime import datetime

logger = setup_logger("database_manager")

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.Session = None
        self._initialize_db()

    def _initialize_db(self):
        db_url = config.get("database.url")
        if not db_url:
            logger.error("Database URL not found in configuration. Please set DATABASE_URL in .env or config.yaml")
            return

        try:
            self.engine = create_engine(db_url)
            Base.metadata.create_all(self.engine) # Create tables if they don't exist
            self.Session = sessionmaker(bind=self.engine)
            logger.info("Database initialized successfully.")
        except SQLAlchemyError as e:
            logger.error(f"Error initializing database: {e}")

    def get_session(self):
        if self.Session:
            return self.Session()
        logger.error("Database session not initialized.")
        return None

    def add_trade(self, trade_data: dict):
        session = self.get_session()
        if not session: return
        try:
            trade = Trade(
                timestamp=trade_data.get("timestamp"),
                symbol=trade_data.get("symbol"),
                side=trade_data.get("side"),
                entry_price=trade_data.get("entry_price"),
                exit_price=trade_data.get("exit_price"),
                amount=trade_data.get("amount"),
                profit_loss_usd=trade_data.get("profit_loss_usd"),
                is_open=trade_data.get("is_open", True)
            )
            session.add(trade)
            session.commit()
            logger.debug(f"Trade added to DB: {trade.id}")
            return trade
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error adding trade to DB: {e}")
        finally:
            session.close()

    def update_trade(self, trade_id: int, updates: dict):
        session = self.get_session()
        if not session: return
        try:
            trade = session.query(Trade).filter_by(id=trade_id).first()
            if trade:
                for key, value in updates.items():
                    setattr(trade, key, value)
                session.commit()
                logger.debug(f"Trade {trade_id} updated in DB.")
                return trade
            else:
                logger.warning(f"Trade with ID {trade_id} not found for update.")
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error updating trade {trade_id} in DB: {e}")
        finally:
            session.close()

    def get_trades(self, symbol: str = None, is_open: bool = None):
        session = self.get_session()
        if not session: return []
        try:
            query = session.query(Trade)
            if symbol: query = query.filter_by(symbol=symbol)
            if is_open is not None: query = query.filter_by(is_open=is_open)
            return query.all()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching trades from DB: {e}")
            return []
        finally:
            session.close()

    def add_market_data(self, data: dict):
        session = self.get_session()
        if not session: return
        try:
            market_data = MarketData(
                timestamp=data.get("timestamp"),
                symbol=data.get("symbol"),
                open_price=data.get("open"),
                high_price=data.get("high"),
                low_price=data.get("low"),
                close_price=data.get("close"),
                volume=data.get("volume")
            )
            session.add(market_data)
            session.commit()
            logger.debug(f"Market data added to DB for {data.get('symbol', 'N/A')}")
            return market_data
        except SQLAlchemyError as e:
            session.rollback()
            logger.error(f"Error adding market data to DB: {e}")
        finally:
            session.close()

    def get_market_data(self, symbol: str = None, start_date: datetime = None, end_date: datetime = None):
        session = self.get_session()
        if not session: return []
        try:
            query = session.query(MarketData)
            if symbol: query = query.filter_by(symbol=symbol)
            if start_date: query = query.filter(MarketData.timestamp >= start_date)
            if end_date: query = query.filter(MarketData.timestamp <= end_date)
            return query.order_by(MarketData.timestamp).all()
        except SQLAlchemyError as e:
            logger.error(f"Error fetching market data from DB: {e}")
            return []
        finally:
            session.close()

    def cleanup(self):
        if self.engine:
            self.engine.dispose()
        logger.info("Database manager cleanup completed.")


