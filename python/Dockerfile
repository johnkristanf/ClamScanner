FROM python:3.12-slim

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y gcc libpq-dev

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r requirements.txt --verbose
RUN pip check

RUN apt-get install -y supervisor

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5000 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
