FROM ubuntu:18.04

RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install rasa-core rasa-nlu[spacy] spacy sklearn-crfsuite rasa-core-sdk
RUN apt-get install default-jre -y

ADD ./ar_model-0.0.0 /app/ar_model-0.0.0
RUN cd /app && pip3 install ar_model-0.0.0/ && rm -rf ar_model-0.0.0/

ADD ./config /app/config/
ADD ./actions /app/actions/
ADD ./scripts /app/scripts/
ADD ./data.json /app/data.json
ADD ./parser.py /app/parser.py
ADD ./lemma_farasa.py /app/lemma_farasa.py
ADD ./FarasaSegmenterJar.jar /app/FarasaSegmenterJar.jar

RUN mkdir /app/data
RUN mkdir /app/data/core
RUN mkdir /app/data/nlu

RUN cd /app;  java -jar FarasaSegmenterJar.jar & (python3 parser.py && \
python3 -m rasa_nlu.train -c config/nlu_config.yml --data data/nlu -o models --project current --fixed_model_name nlu && \
python3 -m rasa_core.train -c config/nlu_config.yml -d domain.yml -o models/current/dialogue -s data/core)

RUN ["chmod", "+x", "/app/scripts/start_services.sh"]
RUN ["chmod", "777", "/app/FarasaSegmenterJar.jar"]

WORKDIR /app
ENTRYPOINT []
CMD /app/scripts/start_services.sh
