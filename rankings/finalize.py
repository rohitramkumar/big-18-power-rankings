import requests
import json
import glob
import os
from typing import Dict, Any, Optional, List

API_URL = "https://engage-api.boostsport.ai/api/sport/mbb/standings/table?seasons=2025&conference=Big%20Ten"

def get_records(url: str) -> Dict[str, str]:
    """Returns overall and conference records for each team."""
    try:
        response = requests.get(url, timeout=10)     
        response.raise_for_status()
        data: Dict[str, Any] = response.json()
    except requests.exceptions.RequestException as e:
        print(f"An error occurred during the network request: {e}")
        return {}
    except json.JSONDecodeError as e:
        print(f"An error occurred while decoding JSON: {e}")
        return {}

    team_records: Dict[str, str] = {}
    
    for team in data['data']:
        alias = team['alias'].lower()
        for stat in team['data']:
          if "conf_record" in stat:
            conference_record = stat['conf_record']
          if "ovr_record" in stat:
            overall_record = stat['ovr_record']
        
        formatted_record = f"{overall_record} ({conference_record})"
        
        team_records[alias] = formatted_record
            
    return team_records


def get_active_rankings_file() -> Optional[str]:
    """Find the active rankings JSON file (excludes template.json)."""
    json_files = glob.glob(os.path.join(os.path.dirname(__file__), "*.json"))
    rankings_files = [f for f in json_files if not f.endswith("template.json")]
    
    if len(rankings_files) == 0:
        print("Error: No active rankings file found.")
        return None
    if len(rankings_files) > 1:
        print(f"Error: Multiple rankings files found: {rankings_files}")
        return None
    
    return rankings_files[0]


def validate_rankings(rankings: List[Dict[str, Any]]) -> bool:
    """
    Validate that rankings has exactly 18 teams with no duplicates 
    and unique ranking values.
    """
    if len(rankings) != 18:
        print(f"Error: Expected 18 teams, found {len(rankings)}")
        return False
    
    # Check for duplicate team IDs
    team_ids = [team.get("id") for team in rankings]
    if len(team_ids) != len(set(team_ids)):
        print("Error: Duplicate team IDs found in rankings")
        return False
    
    # Check for unique ranking values
    rank_values = [team.get("rank") for team in rankings]
    if len(rank_values) != len(set(rank_values)):
        print("Error: Duplicate ranking values found")
        return False
    
    # Check that rankings are 1-18
    if set(rank_values) != set(range(1, 19)):
        print("Error: Rankings must be values 1-18")
        return False
    
    return True


def update_rankings_with_records(rankings: List[Dict[str, Any]], records: Dict[str, str]) -> List[Dict[str, Any]]:
    """Update the record field for each team using the alias as the key."""
    for team in rankings:
        team_id = team.get("id", "").lower()
        if team_id in records:
            team["record"] = records[team_id]
        else:
            print(f"Warning: No record found for team {team_id}")
    
    return rankings


if __name__ == "__main__":
    # Get the active rankings file
    rankings_file = get_active_rankings_file()
    if not rankings_file:
        print("Could not find active rankings file.")
    else:
        # Read the rankings file
        try:
            with open(rankings_file, 'r') as f:
                rankings = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading rankings file: {e}")
        else:
            # Validate the rankings
            if not validate_rankings(rankings):
                print("Rankings validation failed.")
            else:
                # Get the records from the API
                records = get_records(API_URL)
                if not records:
                    print("Could not retrieve standings data.")
                else:
                    # Update rankings with records
                    updated_rankings = update_rankings_with_records(rankings, records)
                    
                    # Write the updated rankings back to the file
                    try:
                        with open(rankings_file, 'w') as f:
                            json.dump(updated_rankings, f, indent=4)
                        print(f"Successfully updated {rankings_file} with team records.")
                    except IOError as e:
                        print(f"Error writing to rankings file: {e}")