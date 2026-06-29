import json
import urllib.request
import urllib.parse
import time
from pathlib import Path
import sys

# Fix printing unicode on Windows console
sys.stdout.reconfigure(encoding='utf-8')

def get_positions_batch(names):
    """Query Wikipedia for a batch of names."""
    results = {}
    for name in names:
        name_lower = name.lower()
        if "zidane" in name_lower and "luca" in name_lower: results[name] = True; continue
        if "mastil" in name_lower: results[name] = True; continue
        if "benbot" in name_lower: results[name] = True; continue
        if "goalkeeper" in name_lower: results[name] = True; continue
        results[name] = False
        
    titles_to_query = [n for n in names if not results[n]]
    if not titles_to_query:
        return results

    try:
        # Wikipedia allows max 50 titles per request
        titles_param = urllib.parse.quote("|".join(titles_to_query))
        url = "https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=" + titles_param
        req = urllib.request.Request(url, headers={'User-Agent': 'PenaltyPredictorBot/1.0'})
        response = urllib.request.urlopen(req)
        res = json.loads(response.read().decode())
        pages = res.get("query", {}).get("pages", {})
        
        for page_id, page_data in pages.items():
            if page_id == "-1": continue
            title = page_data.get("title", "")
            extract = page_data.get("extract", "").lower()
            
            # Map the returned title back to the original name (might differ slightly due to normalization)
            for orig_name in titles_to_query:
                if orig_name.lower() == title.lower() or orig_name in title or title in orig_name:
                    import re
                    match = re.search(r'\b(goalkeeper|midfielder|defender|forward|winger|striker|full-?back|centre-?back)\b', extract[:300])
                    if match and match.group(1) == "goalkeeper":
                        results[orig_name] = True
    except Exception as e:
        print(f"Error checking batch: {e}")
        time.sleep(2) # backoff on error
    return results

def run_position_scraper():
    out_dir = Path(__file__).parent / "output"
    squads_file = out_dir / "national_squads.json"
    pos_file = out_dir / "national_positions.json"
    
    if not squads_file.exists():
        print("No national_squads.json found.")
        return
        
    with open(squads_file, "r", encoding="utf-8") as f:
        national_squads = json.load(f)
        
    positions = {}
    if pos_file.exists():
        with open(pos_file, "r", encoding="utf-8") as f:
            positions = json.load(f)
            
    print("Scraping player positions from Wikipedia...")
    processed = 0
    gk_count = 0
    
    # Collect all unclassified names
    unclassified = []
    for nation, roster in national_squads.items():
        for name in roster:
            if name not in positions:
                unclassified.append(name)
                
    # Process in batches of 30 to be safe
    batch_size = 30
    for i in range(0, len(unclassified), batch_size):
        batch = unclassified[i:i+batch_size]
        batch_results = get_positions_batch(batch)
        
        for name, is_gk in batch_results.items():
            positions[name] = {"is_goalkeeper": is_gk}
            if is_gk:
                gk_count += 1
                
        processed += len(batch)
        print(f"Processed {processed}/{len(unclassified)} players...")
        
        # Save periodically
        with open(pos_file, "w", encoding="utf-8") as f:
            json.dump(positions, f, indent=2)
            
        time.sleep(0.5) # limit to 2 req/sec
        
    print(f"Scraped {processed} new players. Total {gk_count} goalkeepers found in the new batch.")

if __name__ == "__main__":
    run_position_scraper()
