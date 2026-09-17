# Imagem base oficial do Python slim
FROM python:3.12-slim

# Evita que o Python escreva arquivos .pyc e força flush imediato do buffer de saída
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Define diretório de trabalho
WORKDIR /app

# Instala dependências do sistema necessárias se houver
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala requirements primeiro para aproveitar cache de camadas
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . /app/

# Expõe a porta do FastAPI
EXPOSE 8000

# Executa o servidor ASGI Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
