import json
from thefuzz import fuzz

sq = json.load(open('etl/output/national_squads.json', encoding='utf-8'))
aliases = {}

for nation, roster in sq.items():
    if len(roster) > 27:
        # Separate into full names and short names by finding the point where strings get shorter or start repeating tokens
        # Or just compare every string to every other string
        for i in range(len(roster)):
            for j in range(i+1, len(roster)):
                name1 = roster[i]
                name2 = roster[j]
                
                # Check for high token sort ratio (ignores word order)
                score = fuzz.token_sort_ratio(name1, name2)
                
                # Also check if one is a subset of another's initials + words
                # Just use token set ratio
                set_score = fuzz.token_set_ratio(name1, name2)
                
                if set_score > 85 and name1 != name2:
                    # The longer one is the full name, the shorter is the short name
                    if len(name1) > len(name2):
                        aliases[name1] = name2
                    else:
                        aliases[name2] = name1

# Now load existing aliases and update them
try:
    existing = json.load(open('etl/aliases.json', encoding='utf-8'))
except:
    existing = {}

existing.update(aliases)
with open('etl/aliases.json', 'w', encoding='utf-8') as f:
    json.dump(existing, f, indent=2, ensure_ascii=False)

print(f"Added {len(aliases)} new aliases!")
