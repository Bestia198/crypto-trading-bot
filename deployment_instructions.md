# Instrukcje Wdrożenia Crypto Trading Bot

Ten dokument zawiera instrukcje krok po kroku dotyczące wdrożenia bota do handlu kryptowalutami przy użyciu Docker i Docker Compose.

## Wymagania Wstępne

Przed rozpoczęciem upewnij się, że na Twoim serwerze są zainstalowane następujące narzędzia:

*   **Docker:** Silnik kontenerowy. Instrukcje instalacji znajdziesz na [oficjalnej stronie Docker](https://docs.docker.com/get-docker/).
*   **Docker Compose:** Narzędzie do definiowania i uruchamiania aplikacji wielokontenerowych Docker. Instrukcje instalacji znajdziesz na [oficjalnej stronie Docker Compose](https://docs.docker.com/compose/install/).
*   **Git:** System kontroli wersji (opcjonalnie, jeśli będziesz klonować repozytorium).

## Krok 1: Sklonowanie Repozytorium (lub skopiowanie plików)

Jeśli masz dostęp do repozytorium Git, sklonuj je na swój serwer:

```bash
git clone <URL_TWOJEGO_REPOZYTORIUM>
cd crypto-trading-bot
```

Jeśli nie używasz Git, skopiuj wszystkie pliki projektu (w tym `Dockerfile`, `Dockerfile.frontend`, `docker-compose.yml`, `backend/`, `frontend/`, `requirements.txt`, `.env.example`, `config/`) do katalogu na swoim serwerze (np. `~/crypto-trading-bot`).

## Krok 2: Konfiguracja Zmiennych Środowiskowych

Utwórz plik `.env` w głównym katalogu projektu (`crypto-trading-bot/`). Ten plik będzie zawierał wrażliwe dane, takie jak klucze API i hasła. **Nigdy nie umieszczaj tego pliku w publicznym repozytorium Git!**

Możesz użyć pliku `.env.example` jako szablonu:

```bash
cp .env.example .env
```

Edytuj plik `.env` i uzupełnij go swoimi kluczami API Binance (lub innej giełdy), hasłem Redis (jeśli używasz) oraz kluczem JWT. Przykład:

```dotenv
# Binance API Keys (for testnet or production)
BINANCE_API_KEY=TWOJ_KLUCZ_API_BINANCE
BINANCE_API_SECRET=TWOJ_SEKRET_API_BINANCE

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=TWOJE_HASLO_REDIS # Ustaw silne hasło w środowisku produkcyjnym

# JWT Security (for API authentication)
JWT_SECRET_KEY=BARDZO_SILNY_KLUCZ_SEKRETNY_JWT # Wygeneruj długi, losowy klucz
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server Configuration (optional, can be overridden by config.yaml)
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
```

**Ważne:**
*   Zastąp `TWOJ_KLUCZ_API_BINANCE`, `TWOJ_SEKRET_API_BINANCE`, `TWOJE_HASLO_REDIS` i `BARDZO_SILNY_KLUCZ_SEKRETNY_JWT` swoimi rzeczywistymi, bezpiecznymi wartościami.
*   Dla `JWT_SECRET_KEY` użyj długiego, losowego ciągu znaków (np. wygenerowanego za pomocą `openssl rand -hex 32`).
*   Upewnij się, że plik `.env` ma odpowiednie uprawnienia, aby tylko właściciel mógł go odczytać.

## Krok 3: Zbudowanie i Uruchomienie Kontenerów Docker

Przejdź do głównego katalogu projektu (`crypto-trading-bot/`) i uruchom Docker Compose, aby zbudować obrazy i uruchomić kontenery:

```bash
docker compose build
docker compose up -d
```

*   `docker compose build`: Zbuduje obrazy Docker dla backendu (Python/FastAPI), frontendu (React/Nginx) i Redis.
*   `docker compose up -d`: Uruchomi kontenery w tle (`-d` dla trybu detached).

## Krok 4: Weryfikacja Wdrożenia

Możesz sprawdzić status uruchomionych kontenerów:

```bash
docker compose ps
```

Powinieneś zobaczyć trzy kontenery: `backend`, `frontend` i `redis` w stanie `running`.

### Dostęp do Aplikacji

*   **Frontend (strona internetowa):** Dostępny pod adresem IP Twojego serwera na porcie 80 (domyślnie HTTP). Jeśli używasz domeny, będzie dostępny pod Twoją domeną.
    *   Przykład: `http://TWOJ_ADRES_IP_SERWERA`
*   **Backend API:** Dostępny pod adresem IP Twojego serwera na porcie 8000.
    *   Przykład: `http://TWOJ_ADRES_IP_SERWERA:8000`
    *   Dokumentacja API (Swagger UI) będzie dostępna pod `http://TWOJ_ADRES_IP_SERWERA:8000/docs`.

## Krok 5: Logowanie do API (dla testów)

Aby uzyskać dostęp do chronionych endpointów API, musisz najpierw uzyskać token dostępu. Możesz to zrobić za pomocą narzędzia takiego jak `curl` lub z interfejsu Swagger UI.

Domyślne dane logowania (tylko do celów testowych, zmień je w środowisku produkcyjnym):
*   **Nazwa użytkownika:** `user`
*   **Hasło:** `password`

Przykład uzyskania tokena za pomocą `curl`:

```bash
curl -X POST "http://TWOJ_ADRES_IP_SERWERA:8000/token" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "username=user&password=password"
```

Otrzymasz odpowiedź JSON zawierającą `access_token`. Użyj tego tokena w nagłówku `Authorization: Bearer <token>` dla chronionych endpointów.

## Dodatkowe Wskazówki i Bezpieczeństwo

*   **HTTPS:** Zdecydowanie zaleca się skonfigurowanie HTTPS dla Twojej domeny, aby zabezpieczyć komunikację. Możesz użyć Nginx jako reverse proxy z certyfikatami Let's Encrypt (np. za pomocą Certbot).
*   **Firewall:** Skonfiguruj firewall na swoim serwerze, aby zezwolić tylko na niezbędny ruch (np. porty 80, 443, 22 dla SSH).
*   **Monitorowanie:** Regularnie monitoruj logi kontenerów i serwera pod kątem błędów i podejrzanej aktywności.
*   **Aktualizacje:** Regularnie aktualizuj obrazy Docker i zależności projektu, aby zapewnić bezpieczeństwo i stabilność.
*   **Kopie zapasowe:** Twórz regularne kopie zapasowe danych Redis (wolumen `redis_data`).
*   **Zarządzanie sekretami:** W środowisku produkcyjnym rozważ użycie bardziej zaawansowanych menedżerów sekretów, jak wspomniano w pliku `recommendations.md`.

Powodzenia we wdrożeniu!

