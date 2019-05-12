  #!/bin/bash
# To run: bash make_bot.sh <bot_name>
set -x

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

if [ -d "$BOT" ]; then
  echo 'Bot name already exists'; exit
fi
cd backend
mkdir $BOT
mkdir $BOT/config
mkdir $BOT/data
mkdir $BOT/data/core
mkdir $BOT/data/nlu

cp Makefile $BOT/Makefile
cp nlu_config.yml $BOT/config/nlu_config.yml
cp endpoints.yml $BOT/config/endpoints.yml
cp docker-compose.yml $BOT/docker-compose.yml

python3 parser.py $BOT

cd $BOT && make all
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
