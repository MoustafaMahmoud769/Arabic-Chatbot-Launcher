import json
import sys


def write_stories(stories_, path):
    with open(path + "/data/core/stories.md", "w", encoding="utf-8") as stories:
        idx = 0
        for story in stories_:
            stories.write("## story " + str(idx) + "\n")
            assert "intent" in story[0], "Story must begin with an intent: " + str(story)
            for item in story:
                assert len(item.keys()) == 1 and ("intent" in item or "action" in item), "Invalid story format: " + str(item)
                if "intent" in item:
                    stories.write("* " + item["intent"] + "\n")
                else:
                    stories.write(" - " + item["action"] + "\n")
            stories.write("\n")
            idx += 1


def write_nlu(intents, path):
    with open(path + "/data/nlu/nlu.md", "w", encoding="utf-8") as nlu:
        for intent in intents.keys():
            nlu.write("## intent:" + intent + "\n")
            for example in intents[intent]:
                nlu.write("- " + example + "\n")
            nlu.write("\n")


def write_domain(data, path):
    # TODO: write header
    with open(path + "/domain.yml", "w", encoding="utf-8") as domain:
        domain.write("intents:\n")
        for intent in data["intents"].keys():
            domain.write(" - " + intent + "\n")
        domain.write("\n")

        domain.write("actions:\n")
        for action in data["actions"].keys():
            domain.write(" - " + action + "\n")
        domain.write("\n")

        domain.write("templates:\n")
        for action in data["actions"].keys():
            domain.write(" " + action + ":\n")
            for alt in data["actions"][action]:
                domain.write("  - \"" + alt + "\"\n")
        domain.write("\n")

        if "entities" in data:
            domain.write("entities:\n")
            for entity in data["entities"]:
                domain.write(" - " + entity + "\n")
            domain.write("\n")

        if "slots" in data:
            domain.write("slots:\n")
            for slot in data["slots"].keys():
                domain.write(" " + slot + ":\n")
                for attr in data["slots"][slot]:
                    if attr == "values":
                        domain.write("  " + attr + ":\n")
                        for value in data["slots"][slot][attr]:
                            domain.write("  - " + value + "\n")
                    else:
                        domain.write("  " + attr + ": " + data["slots"][slot][attr] + "\n")
            domain.write("\n")


with open("data.json", "r", encoding="utf-8") as json_file:
    data = json.load(json_file)

path = sys.argv[1]
write_domain(data, path)
write_stories(data["stories"], path)
write_nlu(data["intents"], path)
