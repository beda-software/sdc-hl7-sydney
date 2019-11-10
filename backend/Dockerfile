FROM python:3.7
RUN mkdir /app
WORKDIR /app

COPY ./embed/aidbox-python-sdk/requirements ./embed/aidbox-python-sdk/requirements
RUN pip install --no-cache-dir -r ./embed/aidbox-python-sdk/requirements/base.txt -r ./embed/aidbox-python-sdk/requirements/dev.txt

COPY ./requirements ./requirements
RUN pip install --no-cache-dir -r ./requirements/base.txt -r ./requirements/dev.txt  -r ./requirements/test.txt
COPY . .

CMD ["gunicorn", "main:create_app", "--worker-class", "aiohttp.worker.GunicornWebWorker", "-b", "0.0.0.0:8081"]
EXPOSE 8081
