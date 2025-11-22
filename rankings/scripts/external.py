import requests
import json
import os
from typing import Dict, Any

RECORDS_API_URL = "https://engage-api.boostsport.ai/api/sport/mbb/standings/table?seasons=2025&conference=Big%20Ten"
TORVIK_URL = "https://barttorvik.com/2026_team_results.json"

def name_to_alias_mapping() -> Dict[str, str]:
    """
    Read template.json and create a mapping from team ID to team name.
    """
    rankings_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    template_path = os.path.join(rankings_dir, "template.json")
    try:
        with open(template_path, 'r') as f:
            template_data = json.load(f)
        return {team.get('name'):team.get('id') for team in template_data if team.get('id')}
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading template.json: {e}")
        return {}
    
def get_team_records() -> Dict[str, str]:
    win_loss = get_win_loss()
    torvik_ranks = get_torvik()

    team_records: Dict[str, str] = {}
    for team_name, team_id in name_to_alias_mapping().items():
        record = win_loss.get(team_id, "N/A")
        torvik_rank = torvik_ranks.get(team_id, "N/A")
        team_records[team_id] = f"{record}, TRank: {torvik_rank}"

    return team_records


def get_win_loss() -> Dict[str, str]:
    """Returns overall and conference records for each team."""
    try:
        response = requests.get(RECORDS_API_URL, timeout=10)     
        response.raise_for_status()
        data: Dict[str, Any] = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the network request: {e}")
        return {}
    except json.JSONDecodeError as e:
        print(f"An error occurred while decoding JSON: {e}")
        return {}

    win_loss: Dict[str, str] = {}
    
    for team in data['data']:
        alias = team['alias'].lower()
        for stat in team['data']:
          if "conf_record" in stat:
            conference_record = stat['conf_record']
          if "ovr_record" in stat:
            overall_record = stat['ovr_record']
        
        formatted_record = f"{overall_record} ({conference_record})"
        
        win_loss[alias] = formatted_record
            
    return win_loss


def get_torvik() -> Dict[str, int]:
    """
    Scrape Torvik data and return a mapping from team ID to Torvik rank.
    Uses name_to_alias_mapping() to map team names to IDs.
    """
    try:
        response = requests.get(TORVIK_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred fetching Torvik data: {e}")
        return {}
    except json.JSONDecodeError as e:
        print(f"An error occurred decoding Torvik JSON: {e}")
        return {}

    # Get the name to ID mapping
    name_to_id = name_to_alias_mapping()
    
    torvik_ranks: Dict[str, int] = {}
    
    # Assuming data is a dict with team names as keys and ranking info as values
    # Adjust parsing based on actual Torvik JSON structure
    for team in data:
        team_name = team[1].replace("St.", "State")
        if team_name in name_to_id:
            team_id = name_to_id[team_name]
            # Extract rank from team_info (adjust based on actual structure)
            rank = team[0]
            if rank is not None:
                torvik_ranks[team_id] = int(rank)
    
    return torvik_ranks
