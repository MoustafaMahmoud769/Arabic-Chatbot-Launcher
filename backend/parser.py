import json
import sys
from rasa_nlu.training_data import load_data

intents = {}

def write_stories(stories_, path):
    with open(path + "/data/core/stories.md", "w", encoding="utf-8") as stories:
        stories.write("## fallback\n")
        stories.write(" - utter_default\n\n")
        idx = 0
        for story in stories_:
            stories.write("## story " + str(idx) + "\n")
            assert "intent" in story[0], "Story must begin with an intent: " + str(story)
            for item in story:
                assert len(item.keys()) == 1 and ("intent" in item or "action" in item), "Invalid story format: " + str(item)
                if "intent" in item:
                    stories.write("* " + item["intent"] + str(intents[item["intent"]]).replace("{}", "").replace("'", "\"") + "\n")
                else:
                    if not item["action"].startswith("utter_"):
                        stories.write(" - utter_" + item["action"] + "\n")
                    else:
                        stories.write(" - " + item["action"] + "\n")
            stories.write("\n")
            idx += 1


def write_domain(data, path):
    # TODO: write header
    with open(path + "/domain.yml", "w", encoding="utf-8") as domain:
        entities = set()
        for example in data["rasa_nlu_data"]["common_examples"]:
            intents[example["intent"]] = {}
            if "entities" in example:
                for entity in example["entities"]:
                    intents[example["intent"]][entity["entity"]] = entity["value"]
                    entities.add(entity["entity"])
        entities = list(entities)

        domain.write("intents:\n")
        if len(intents) > 0:
            for intent in intents.keys():
                domain.write(" - " + intent + "\n")
            domain.write("\n")

        if len(entities) > 0:
            domain.write("entities:\n")
            for entity in entities:
                domain.write(" - " + entity + "\n")
            domain.write("\n")

        domain.write("actions:\n")
        domain.write(" - utter_default\n")
        for action in data["actions"].keys():
            if not action.startswith("utter_"):
                domain.write(" - utter_" + action + "\n")
            else:
                domain.write(" - " + action + "\n")
        domain.write("\n")

        domain.write("templates:\n")
        domain.write(" utter_default:\n")
        domain.write("  - \"آسف لم افهم ذلك\"\n")
        for action in data["actions"].keys():
            if not action.startswith("utter_"):
                domain.write(" utter_" + action + ":\n")
            else:
                domain.write(" " + action + ":\n")
            for alt in data["actions"][action]:
                domain.write("  - \"" + alt + "\"\n")
        domain.write("\n")

def write_nlu(data, path):
    with open("data_nlu.json", "w", encoding="utf-8") as json_nlu:
        json_nlu.write(json.dumps({"rasa_nlu_data": data["rasa_nlu_data"]}, indent=2))

    with open(path + "/data/nlu/nlu.md", "w", encoding="utf-8") as nlu:
        nlu.write(load_data("data_nlu.json").as_markdown())


with open("data.json", "r", encoding="utf-8") as json_file:
    data = json.load(json_file)


path = sys.argv[1]
write_domain(data, path)
write_stories(data["stories"], path)
write_nlu(data, path)
