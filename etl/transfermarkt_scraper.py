import requests
from bs4 import BeautifulSoup
import json
from pathlib import Path
import time
import random

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

LEAGUES = [
    {"name": "Premier League", "code": "GB1", "nation": "England", "url": "https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1"},
    {"name": "La Liga", "code": "ES1", "nation": "Spain", "url": "https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1"},
    {"name": "Bundesliga", "code": "L1", "nation": "Germany", "url": "https://www.transfermarkt.com/bundesliga/startseite/wettbewerb/L1"},
    {"name": "Serie A", "code": "IT1", "nation": "Italy", "url": "https://www.transfermarkt.com/serie-a/startseite/wettbewerb/IT1"},
    {"name": "Ligue 1", "code": "FR1", "nation": "France", "url": "https://www.transfermarkt.com/ligue-1/startseite/wettbewerb/FR1"},
    {"name": "Eredivisie", "code": "NL1", "nation": "Netherlands", "url": "https://www.transfermarkt.com/eredivisie/startseite/wettbewerb/NL1"},
    {"name": "Major League Soccer", "code": "MLS1", "nation": "United States", "url": "https://www.transfermarkt.com/major-league-soccer/startseite/wettbewerb/MLS1"},
    {"name": "Saudi Pro League", "code": "SA1", "nation": "Saudi Arabia", "url": "https://www.transfermarkt.com/saudi-pro-league/startseite/wettbewerb/SA1"}
]

def get_soup(url):
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
    except requests.exceptions.RequestException as e:
        print(f"Request exception for {url}: {e}")
        return None
    if response.status_code != 200:
        print(f"Failed to fetch {url}. Status code: {response.status_code}")
        return None
    return BeautifulSoup(response.text, 'html.parser')

def get_club_links(league_url):
    """Get the URLs for each club participating in the league."""
    soup = get_soup(league_url)
    if not soup:
        return []
        
    clubs = []
    # In league pages, clubs are in a table under td class="hauptlink no-border-links"
    table = soup.find("table", class_="items")
    if not table:
        return clubs
        
    rows = table.find("tbody").find_all("tr", recursive=False)
    for row in rows:
        td = row.find("td", class_="hauptlink", attrs={"class": "no-border-links"})
        if td and td.find("a"):
            a_tag = td.find("a")
            href = a_tag["href"]
            club_name = a_tag.text.strip()
            if href:
                if "/startseite/" in href:
                    href = href.replace("/startseite/", "/kader/")
                full_url = "https://www.transfermarkt.com" + href
                clubs.append({"name": club_name, "url": full_url})
                
    return clubs

def scrape_club_squad(club_url, club_name, league_name, club_nation):
    """Scrape the players from a club's squad page."""
    print(f"  Scraping squad for {club_name}...")
    soup = get_soup(club_url)
    if not soup:
        return []
        
    players = []
    table = soup.find("table", class_="items")
    if not table:
        return []
        
    tbody = table.find("tbody")
    if not tbody:
        return []
        
    rows = tbody.find_all("tr", recursive=False)
    
    for row in rows:
        if "odd" not in row.get("class", []) and "even" not in row.get("class", []):
            continue
            
        tds = row.find_all("td")
        if len(tds) < 6:
            continue
            
        name_td = row.find("td", class_="hauptlink")
        if not name_td or not name_td.find("a"):
            continue
            
        player_name = name_td.find("a").text.strip()
        
        # Player personal nationality
        nation = "Unknown"
        flags = row.find_all("img", class_="flaggenrahmen")
        if flags:
            nation = flags[0].get("title", "Unknown")
            
        # Position
        pos_table = row.find("table", class_="inline-table")
        position = "Unknown"
        if pos_table:
            pos_td = pos_table.find_all("tr")[-1].find("td")
            if pos_td:
                position = pos_td.text.strip()
                
        players.append({
            "name": player_name,
            "nation": nation,
            "club": club_name,
            "league": league_name,
            "club_nation": club_nation,
            "position": position
        })
        
    time.sleep(random.uniform(0.5, 1.5))
    return players

def scrape_all_leagues():
    all_players = []
    for league in LEAGUES:
        print(f"Starting scrape for league: {league['name']} ({league['nation']})")
        clubs = get_club_links(league["url"])
        print(f"Found {len(clubs)} clubs in {league['name']}.")
        
        for club in clubs:
            players = scrape_club_squad(club["url"], club["name"], league["name"], league["nation"])
            all_players.extend(players)
            
    return all_players

if __name__ == "__main__":
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    
    players = scrape_all_leagues()
    
    if players:
        with open(out_dir / "transfermarkt_squads.json", "w", encoding="utf-8") as f:
            json.dump(players, f, indent=2)
        print(f"Successfully scraped {len(players)} players to transfermarkt_squads.json")
    else:
        print("Scraping failed or no players found.")
