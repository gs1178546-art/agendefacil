FROM nginx:alpine

# Remover a config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nossa config customizada
COPY nginx.conf /etc/nginx/conf.d/

# Copiar todos os arquivos do site para o Nginx
COPY . /usr/share/nginx/html/

# Remover arquivos desnecessários da imagem
RUN rm -f /usr/share/nginx/html/Dockerfile \
    && rm -f /usr/share/nginx/html/nginx.conf \
    && rm -rf /usr/share/nginx/html/.git

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
