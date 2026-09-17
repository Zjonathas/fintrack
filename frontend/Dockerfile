# Imagem base do Node oficial leve
FROM node:22-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala todas as dependências na criação da imagem
RUN npm install

# Copia o código fonte do frontend
COPY . .

# Expõe a porta do Vite dev server
EXPOSE 5173

# Garante que o volume anônimo (/app/node_modules) sincronize dependências adicionadas e inicia o Vite
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]
