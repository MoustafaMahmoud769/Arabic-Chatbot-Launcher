#!/bin/bash
# To run: bash make_bot.sh <bot_name>

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

rm -rf $BOT
mkdir $BOT
mkdir $BOT/data
mkdir $BOT/data/core
mkdir $BOT/data/nlu

cp Makefile $BOT/Makefile
cp nlu_config.yml $BOT/nlu_config.yml

python3 parser.py $BOT

cd $BOT && make all
