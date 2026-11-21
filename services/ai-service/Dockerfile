FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app app
# "::" listens on IPv6 and IPv4 (private networking between services is IPv6).
# h11: the gateway's HTTP client sends an HTTP/2 upgrade header the default parser mishandles.
CMD ["sh", "-c", "exec uvicorn app.main:app --host :: --port ${PORT:-8083} --http h11"]
