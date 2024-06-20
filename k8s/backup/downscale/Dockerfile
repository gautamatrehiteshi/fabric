FROM python:3.7

ADD ./requirements.txt .
RUN pip3 install -r requirements.txt

RUN mkdir /app
ADD ./app/ /app
WORKDIR /app

RUN ls
CMD ["python3", "downscale_deployment.py"]