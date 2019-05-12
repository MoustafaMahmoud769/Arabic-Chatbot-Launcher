#!/bin/bash
# To run: bash make_bot.sh <bot_name>
# set -x

BOT=$1
key=$1
# String's length check
val=$(echo "${#key}")
if [ $val -gt 255 ];
   then echo "Invalid Bot name"; exit
fi

# Is valid characters exist
if ! [[ $key =~ ^[0-9a-zA-Z._-]+$ ]]; then
    echo 'Invalid Bot name'; exit
fi

# First character check
key=$(echo $key | cut -c1-1)
if ! [[ $key =~ ^[0-9a-zA-Z]+$ ]]; then
    echo 'Invalid Bot name'; exit
fi

cd backend 2>&1 | grep "error"
if ! [ -d "$BOT" ]; then
  mkdir $BOT
fi
if ! [ -d "$BOT/data" ]; then
  mkdir $BOT/data
fi
if ! [ -d "$BOT/data/core" ]; then
  mkdir $BOT/data/core
fi
if ! [ -d "$BOT/data/nlu" ]; then
  mkdir $BOT/data/nlu
fi

cp templates/Makefile $BOT/Makefile
cp templates/nlu_config.yml $BOT/nlu_config.yml
cp templates/credentials.yml $BOT/credentials.yml
# cp templates/endpoints.yml $BOT/endpoints.yml
# cp docker-compose.yml $BOT/docker-compose.yml

error=$(python3 parser.py $BOT | grep "error")
if ! [ -z "$error" ]; then
  echo 'Error parsing data'; exit
fi

error=$(cd $BOT && make all 2>&1 | grep "error")
if ! [ -z "$error" ]; then
  echo 'Error training bot'; exit
fi
echo 'Bot Trained Successfully'

# cd $BOT && \
# docker run \
#   -v $(pwd):/app/project \
#   -v $(pwd)/models/rasa_core:/app/models \
#   rasa/rasa_core:latest \
#   train \
#     --domain project/domain.yml \
#     --stories project/data/core/stories.md \
#     --out models && \
# docker run \
#   -v $(pwd):/app/project \
#   -v $(pwd)/models/rasa_nlu:/app/models \
#   rasa/rasa_nlu:latest-spacy \
#   run \
#     python -m rasa_nlu.train \
#     -c project/config/nlu_config.yml \
#     -d project/data/nlu/nlu.md \
#     -o models \
#     --project current
