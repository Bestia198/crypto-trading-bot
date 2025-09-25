from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Dict, Any
from datetime import timedelta

from ..utils.logger import setup_logger
from ..utils.config import config
from .auth import create_access_token, decode_access_token, verify_password, get_user, User

logger = setup_logger("rest_api")
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = get_user(username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user

@router.post("/token", summary="Authenticate user and get access token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=config.get("security.access_token_expire_minutes", 30))
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/health", summary="Check API health")
async def health_check():
    return {"status": "ok", "message": "API is healthy"}

@router.get("/portfolio/summary", summary="Get portfolio summary", dependencies=[Depends(get_current_active_user)])
async def get_portfolio_summary_api(request: Request):
    portfolio_manager = request.app.state.portfolio_manager
    if not portfolio_manager:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Portfolio manager not initialized")
    return portfolio_manager.get_portfolio_summary()

@router.get("/market_data/{symbol}", summary="Get market data for a specific symbol", dependencies=[Depends(get_current_active_user)])
async def get_symbol_market_data(symbol: str, request: Request):
    market_data_collector = request.app.state.market_data_collector
    if not market_data_collector:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market data collector not initialized")
    data = await market_data_collector.get_current_data(symbol.upper())
    if not data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Market data for {symbol} not found")
    return data

@router.get("/market_data", summary="Get all available market data", dependencies=[Depends(get_current_active_user)])
async def get_all_market_data(request: Request):
    market_data_collector = request.app.state.market_data_collector
    if not market_data_collector:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market data collector not initialized")
    return await market_data_collector.get_current_data()

@router.get("/trades", summary="Get recent trades", dependencies=[Depends(get_current_active_user)])
async def get_recent_trades(limit: int = 100, request: Request = None):
    storage_manager = request.app.state.storage_manager
    if not storage_manager:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Storage manager not initialized")
    return await storage_manager.get_trades(limit)

@router.get("/strategy/simple_ma/recommendation/{symbol}", summary="Get Simple MA strategy recommendation for a symbol", dependencies=[Depends(get_current_active_user)])
async def get_simple_ma_recommendation(symbol: str, request: Request):
    market_data_collector = request.app.state.market_data_collector
    if not market_data_collector:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market data collector not initialized")
    
    market_data = await market_data_collector.get_current_data(symbol.upper())
    if not market_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Market data for {symbol} not found")

    sma_short = market_data.get(f"sma_{config.get('strategies.simple_ma.short_period', 5)}")
    sma_long = market_data.get(f"sma_{config.get('strategies.simple_ma.long_period', 10)}")

    recommendation = "HOLD"
    if sma_short and sma_long:
        if sma_short > sma_long:
            recommendation = "BUY"
        elif sma_short < sma_long:
            recommendation = "SELL"

    return {"symbol": symbol, "recommendation": recommendation, "sma_short": sma_short, "sma_long": sma_long}

@router.get("/trading/can_open_position", summary="Check if a new position can be opened", dependencies=[Depends(get_current_active_user)])
async def check_can_open_position(amount_usd: float, request: Request):
    portfolio_manager = request.app.state.portfolio_manager
    if not portfolio_manager:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Portfolio manager not initialized")
    return {"can_open": portfolio_manager.can_open_position(amount_usd)}

@router.get("/trading/good_time_to_trade/{symbol}", summary="Determine if it's a good time to trade a symbol", dependencies=[Depends(get_current_active_user)])
async def check_good_time_to_trade(symbol: str, request: Request):
    market_data_collector = request.app.state.market_data_collector
    if not market_data_collector:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Market data collector not initialized")
    return await market_data_collector.is_good_time_to_trade(symbol.upper())


