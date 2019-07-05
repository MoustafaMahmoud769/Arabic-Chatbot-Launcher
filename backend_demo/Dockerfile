FROM ubuntu:18.04

RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install rasa-core rasa-nlu[spacy] spacy sklearn-crfsuite rasa-core-sdk
RUN apt-get install default-jre -y

ADD ./ar_model-0.0.0 /app/ar_model-0.0.0
RUN cd /app && pip3 install ar_model-0.0.0/ && rm -rf ar_model-0.0.0/

ADD ./demo /app/demo/
ADD ./models /app/models/
ADD ./config /app/config/
ADD ./scripts /app/scripts/
ADD ./lemma_farasa.py /app/lemma_farasa.py
ADD ./FarasaSegmenterJar.jar /app/FarasaSegmenterJar.jar

RUN ["chmod", "+x", "/app/scripts/start_services.sh"]
RUN ["chmod", "777", "/app/FarasaSegmenterJar.jar"]

WORKDIR /app
ENTRYPOINT []
CMD /app/scripts/start_services.sh
