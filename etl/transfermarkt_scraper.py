import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path
import time
import random

# Transfermarkt requires a valid User-Agent
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def get_soup(url):
    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        print(f"Failed to fetch {url}. Status code: {response.status_code}")
        return None
    return BeautifulSoup(response.text, 'html.parser')

def get_team_links(competition_url):
    """Get the URLs for each national team participating in the competition."""
    soup = get_soup(competition_url)
    if not soup:
        return []
        
    teams = []
    # Find all team links in the competition participants table
    # Transfermarkt usually has them in table rows with class "hauptlink" inside the participants table
    boxes = soup.find_all("div", class_="box")
    for box in boxes:
        table = box.find("table", class_="items")
        if table:
            rows = table.find_all("tr")
            for row in rows:
                td = row.find("td", class_="hauptlink")
                if td and td.find("a"):
                    a_tag = td.find("a")
                    href = a_tag["href"]
                    team_name = a_tag.text.strip()
                    if href:
                        # Convert to squad page link (usually /startseite/ -> /kader/)
                        if "/startseite/" in href:
                            href = href.replace("/startseite/", "/kader/")
                        # For national teams, sometimes it's under different paths, ensure we get the full URL
                        full_url = "https://www.transfermarkt.com" + href
                        teams.append({"name": team_name, "url": full_url})
    
    # Deduplicate
    unique_teams = []
    seen_names = set()
    for team in teams:
        if team["name"] not in seen_names:
            seen_names.add(team["name"])
            unique_teams.append(team)
            
    return unique_teams

def scrape_team_squad(team_url, team_name):
    """Scrape the players from a national team's squad page."""
    print(f"Scraping squad for {team_name}...")
    soup = get_soup(team_url)
    if not soup:
        return []
        
    players = []
    # Transfermarkt squad tables usually have class "items"
    table = soup.find("table", class_="items")
    if not table:
        print(f"No squad table found for {team_name}.")
        return []
        
    rows = table.find("tbody").find_all("tr", recursive=False) if table.find("tbody") else table.find_all("tr", recursive=False)
    
    for row in rows:
        # Transfermarkt has odd/even classes for rows
        if "odd" not in row.get("class", []) and "even" not in row.get("class", []):
            continue
            
        tds = row.find_all("td")
        if len(tds) < 6:
            continue
            
        # Player name is usually in a td with class "hauptlink"
        name_td = row.find("td", class_="hauptlink")
        if not name_td or not name_td.find("a"):
            continue
            
        player_name = name_td.find("a").text.strip()
        
        # Position
        pos_table = row.find("table", class_="inline-table")
        position = "Unknown"
        if pos_table:
            pos_td = pos_table.find_all("tr")[-1].find("td")
            if pos_td:
                position = pos_td.text.strip()
                
        # Club affiliation is usually the last td with an image (a tag wrapping an img)
        club = "Unknown"
        # Search for club crest image in the row
        club_links = row.find_all("a", href=lambda href: href and "verein" in href.lower())
        for link in club_links:
            img = link.find("img")
            if img and img.get("alt"):
                club = img.get("alt").strip()
                break
                
        players.append({
            "name": player_name,
            "nation": team_name,
            "club": club,
            "position": position
        })
        
    time.sleep(random.uniform(1.0, 3.0)) # Be polite
    return players

def scrape_world_cup_squads(competition_url="https://www.transfermarkt.com/weltmeisterschaft-2022/teilnehmer/pokalwettbewerb/WM22"):
    """Main function to scrape the entire competition."""
    print(f"Starting scrape for competition: {competition_url}")
    teams = get_team_links(competition_url)
    print(f"Found {len(teams)} teams.")
    
    all_players = []
    
    for team in teams:
        players = scrape_team_squad(team["url"], team["name"])
        all_players.extend(players)
        
    return all_players

if __name__ == "__main__":
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    
    # We use World Cup 2022 URL as a robust fallback/test for the pipeline 
    # until the official 2026 URL stabilizes on Transfermarkt.
    # The pipeline architecture remains the same.
    players = scrape_world_cup_squads()
    
    if players:
        with open(out_dir / "transfermarkt_squads.json", "w") as f:
            json.dump(players, f, indent=2)
        print(f"Successfully scraped {len(players)} players to transfermarkt_squads.json")
    else:
        print("Scraping failed or no players found.")
