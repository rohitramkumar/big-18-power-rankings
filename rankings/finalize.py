import requests
import json
import glob
import os
import re
from typing import Dict, Any, Optional, List
from datetime import datetime

API_URL = "https://engage-api.boostsport.ai/api/sport/mbb/standings/table?seasons=2025&conference=Big%20Ten"

def validate_filename_format(filename: str) -> bool:
    """
    Validate that filename has the correct format: YYYY-MM-DD.json
    and that the date is valid.
    """
    # Extract the filename without path
    basename = os.path.basename(filename)
    
    # Check format YYYY-MM-DD.json
    pattern = r'^(\d{4})-(\d{2})-(\d{2})\.json$'
    match = re.match(pattern, basename)
    
    if not match:
        print(f"Error: Filename '{basename}' does not match format YYYY-MM-DD.json")
        return False
    
    # Validate that the date is actual valid
    year, month, day = match.groups()
    try:
        datetime(int(year), int(month), int(day))
        return True
    except ValueError as e:
        print(f"Error: Invalid date in filename '{basename}': {e}")
        return False

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
    # Exclude template and mvps files from the list of ranking files
    rankings_files = [
        f for f in json_files
        if not os.path.basename(f).endswith("template.json") and not os.path.basename(f).endswith("mvps.json") and not os.path.basename(f).endswith("players.json")
    ]
    
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


def compute_and_attach_trends(rankings: List[Dict[str, Any]], archives_subdir: str = "archives") -> List[Dict[str, Any]]:
    """
    Read the most recent archive file from `archives_subdir` and attach a numeric
    `trend` to each team in `rankings`.

    Trend is calculated as: previousRank - currentRank (positive => moved up).
    If no previous rank exists for a team, trend is set to 0.
    """
    archives_dir = os.path.join(os.path.dirname(__file__), archives_subdir)
    prev_ranks: Dict[str, int] = {}
    try:
        if os.path.isdir(archives_dir):
            archive_files = [f for f in os.listdir(archives_dir) if f.endswith('.json')]
            archive_files.sort()
            archive_files.reverse()
            if archive_files:
                latest_archive = os.path.join(archives_dir, archive_files[0])
                with open(latest_archive, 'r') as af:
                    archive_data = json.load(af)
                for t in archive_data:
                    tid = t.get('id')
                    trank = t.get('rank')
                    if isinstance(tid, str) and isinstance(trank, int):
                        prev_ranks[tid] = trank
    except Exception:
        prev_ranks = {}

    # Attach trend to each team
    for team in rankings:
        tid = team.get('id')
        current_rank = team.get('rank')
        if isinstance(tid, str) and isinstance(current_rank, int):
            prev = prev_ranks.get(tid)
            team['trend'] = (prev - current_rank) if isinstance(prev, int) else 0
        else:
            team['trend'] = 0

    return rankings


if __name__ == "__main__":
    # Get the active rankings file
    rankings_file = get_active_rankings_file()
    if not rankings_file:
        print("Could not find active rankings file.")
        exit(1)
    
    # Validate filename format
    if not validate_filename_format(rankings_file):
        print("Filename validation failed.")
        exit(1)
    
    # Read the rankings file
    try:
        with open(rankings_file, 'r') as f:
            rankings = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading rankings file: {e}")
        exit(1)
    
    # Validate the rankings
    if not validate_rankings(rankings):
        print("Rankings validation failed.")
        exit(1)
    
    # Get the records from the API
    records = get_records(API_URL)
    if not records:
        print("Could not retrieve standings data.")
        exit(1)
    
    # Update rankings with records
    updated_rankings = update_rankings_with_records(rankings, records)
    
    # Compute and attach trend values using the latest archive
    updated_rankings = compute_and_attach_trends(updated_rankings)
    
    # Write the updated rankings back to the file
    try:
        with open(rankings_file, 'w') as f:
            json.dump(updated_rankings, f, indent=4)
        print(f"Successfully updated {rankings_file} with team records.")
    except IOError as e:
        print(f"Error writing to rankings file: {e}")
        exit(1)