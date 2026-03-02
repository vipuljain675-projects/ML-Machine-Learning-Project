from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import numpy as np
import pandas as pd
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
with open("geopolitical_model.pkl", "rb") as f:
    model = pickle.load(f)

with open("dyadic_model.pkl", "rb") as f:
    dyadic_model = pickle.load(f)

# Load precomputed dyadic predictions
df_dyadic = pd.read_csv("dyadic_predictions.csv")

# Load scenario knowledge base
with open("scenario_knowledge.json", "r") as f:
    scenario_knowledge = json.load(f)

FEATURES = ['gdp_growth', 'military_spend', 'working_age_pop',
            'gdp_per_capita_growth', 'inflation', 'unemployment',
            'conflict_last_year', 'conflict_3yr_avg']

COUNTRY_DATA = {
    "USA":         {"gdp_growth":[2.8,2.5,2.3,2.0,2.2,2.5,2.8,3.0,3.0,2.8,2.8,2.5,2.5,2.3,2.3,2.0],"military_spend":[3.5,3.6,3.7,3.8,3.8,3.7,3.5,3.5,3.3,3.3,3.2,3.2,3.0,3.0,3.0,3.0],"working_age_pop":[65.0,65.0,64.8,64.5,64.3,64.0,63.8,63.5,63.3,63.0,62.8,62.5,62.3,62.0,61.8,61.5],"gdp_per_capita_growth":[2.0,1.8,1.5,1.3,1.5,1.8,2.0,2.2,2.2,2.0,2.0,1.8,1.8,1.5,1.5,1.3],"inflation":[3.0,2.8,2.5,2.5,2.5,2.3,2.2,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],"unemployment":[4.2,4.5,4.8,5.0,4.8,4.5,4.2,4.0,4.0,3.8,3.8,3.8,4.0,4.0,4.2,4.2],"conflict_last_year":[0.1,0.1,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    "Russia":      {"gdp_growth":[-3.0,-2.0,-1.0,0.0,0.5,1.0,1.5,1.5,1.0,1.0,1.5,1.5,2.0,2.0,2.0,2.0],"military_spend":[5.9,6.0,6.0,5.5,5.0,4.5,4.0,3.8,3.5,3.5,3.2,3.2,3.0,3.0,2.8,2.8],"working_age_pop":[63.0,62.8,62.5,62.2,62.0,61.8,61.5,61.2,61.0,60.8,60.5,60.2,60.0,59.8,59.5,59.2],"gdp_per_capita_growth":[-3.5,-2.5,-1.5,-0.5,0.2,0.8,1.2,1.2,0.8,0.8,1.2,1.2,1.5,1.5,1.5,1.5],"inflation":[7.0,7.5,8.0,7.5,7.0,6.5,6.0,5.5,5.0,5.0,4.5,4.5,4.0,4.0,4.0,3.8],"unemployment":[4.0,4.5,5.0,5.5,5.5,5.0,4.8,4.5,4.5,4.2,4.2,4.0,4.0,3.8,3.8,3.5],"conflict_last_year":[1.0,1.0,1.0,0.8,0.5,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[1.0,1.0,1.0,0.9,0.8,0.5,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0]},
    "China":       {"gdp_growth":[4.5,4.0,3.8,3.5,3.5,3.8,4.0,4.2,4.2,4.0,4.0,3.8,3.8,3.5,3.5,3.5],"military_spend":[1.7,1.8,1.9,2.0,2.1,2.1,2.2,2.2,2.3,2.3,2.4,2.4,2.5,2.5,2.5,2.5],"working_age_pop":[68.0,67.8,67.5,67.2,67.0,66.8,66.5,66.2,66.0,65.8,65.5,65.2,65.0,64.8,64.5,64.2],"gdp_per_capita_growth":[4.0,3.5,3.3,3.0,3.0,3.3,3.5,3.8,3.8,3.5,3.5,3.3,3.3,3.0,3.0,3.0],"inflation":[2.0,2.2,2.5,2.5,2.8,2.8,3.0,3.0,3.2,3.2,3.5,3.5,3.5,3.8,3.8,4.0],"unemployment":[5.5,5.8,6.0,6.0,6.2,6.2,6.5,6.5,6.8,6.8,7.0,7.0,7.2,7.2,7.5,7.5],"conflict_last_year":[0.0,0.0,0.0,0.1,0.1,0.1,0.1,0.2,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.1],"conflict_3yr_avg":[0.0,0.0,0.0,0.0,0.1,0.1,0.1,0.1,0.2,0.2,0.1,0.1,0.1,0.1,0.1,0.1]},
    "India":       {"gdp_growth":[6.5,6.8,7.0,7.2,7.0,6.8,6.5,6.5,6.2,6.2,6.0,6.0,5.8,5.8,5.5,5.5],"military_spend":[2.4,2.5,2.5,2.6,2.6,2.7,2.7,2.8,2.8,2.9,2.9,3.0,3.0,3.0,3.0,3.0],"working_age_pop":[67.0,67.3,67.5,67.8,68.0,68.2,68.5,68.7,69.0,69.2,69.5,69.7,70.0,70.2,70.5,70.7],"gdp_per_capita_growth":[5.5,5.8,6.0,6.2,6.0,5.8,5.5,5.5,5.2,5.2,5.0,5.0,4.8,4.8,4.5,4.5],"inflation":[5.0,4.8,4.5,4.2,4.0,4.0,3.8,3.8,3.5,3.5,3.5,3.2,3.2,3.0,3.0,3.0],"unemployment":[8.0,7.8,7.5,7.2,7.0,6.8,6.5,6.2,6.0,5.8,5.5,5.2,5.0,4.8,4.5,4.2],"conflict_last_year":[0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.3,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0]},
    "Iran":        {"gdp_growth":[-1.5,-2.0,-1.0,0.5,1.0,1.5,2.0,2.0,1.5,1.0,1.0,1.5,1.5,2.0,2.0,2.0],"military_spend":[2.5,2.8,3.0,3.2,3.0,2.8,2.5,2.5,2.3,2.3,2.2,2.2,2.0,2.0,2.0,2.0],"working_age_pop":[65.0,65.2,65.4,65.5,65.6,65.7,65.8,65.9,66.0,66.0,66.1,66.1,66.2,66.2,66.3,66.3],"gdp_per_capita_growth":[-2.0,-2.5,-1.5,0.2,0.8,1.2,1.8,1.8,1.2,0.8,0.8,1.2,1.2,1.5,1.5,1.5],"inflation":[40.0,38.0,35.0,30.0,25.0,20.0,18.0,15.0,12.0,10.0,10.0,9.0,9.0,8.0,8.0,7.0],"unemployment":[11.0,11.5,11.0,10.5,10.0,9.5,9.0,8.5,8.0,8.0,7.5,7.5,7.0,7.0,6.5,6.5],"conflict_last_year":[1.0,1.0,1.0,1.0,0.5,0.5,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.1],"conflict_3yr_avg":[0.8,0.9,1.0,0.9,0.8,0.6,0.4,0.3,0.2,0.2,0.2,0.2,0.1,0.1,0.1,0.1]},
    "Israel":      {"gdp_growth":[1.5,2.0,2.5,3.0,3.5,3.5,3.8,4.0,4.0,3.8,3.8,3.5,3.5,3.2,3.2,3.0],"military_spend":[5.5,5.8,5.5,5.0,4.8,4.5,4.2,4.0,3.8,3.8,3.5,3.5,3.2,3.2,3.0,3.0],"working_age_pop":[60.0,60.2,60.5,60.8,61.0,61.2,61.5,61.8,62.0,62.2,62.5,62.8,63.0,63.2,63.5,63.8],"gdp_per_capita_growth":[0.5,1.0,1.5,2.0,2.5,2.8,3.0,3.2,3.2,3.0,3.0,2.8,2.8,2.5,2.5,2.3],"inflation":[4.5,4.0,3.5,3.0,2.8,2.5,2.5,2.3,2.3,2.2,2.2,2.0,2.0,2.0,2.0,2.0],"unemployment":[5.0,4.8,4.5,4.2,4.0,3.8,3.8,3.5,3.5,3.5,3.2,3.2,3.0,3.0,3.0,3.0],"conflict_last_year":[1.0,1.0,0.8,0.5,0.3,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.1,0.0,0.0,0.0],"conflict_3yr_avg":[1.0,1.0,0.9,0.7,0.5,0.4,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.1,0.0,0.0]},
    "UK":          {"gdp_growth":[1.2,1.5,1.8,2.0,2.0,2.2,2.2,2.5,2.5,2.3,2.3,2.0,2.0,1.8,1.8,1.5],"military_spend":[2.3,2.5,2.5,2.5,2.5,2.3,2.3,2.2,2.2,2.2,2.0,2.0,2.0,2.0,2.0,2.0],"working_age_pop":[63.5,63.3,63.0,62.8,62.5,62.3,62.0,61.8,61.5,61.3,61.0,60.8,60.5,60.3,60.0,59.8],"gdp_per_capita_growth":[0.8,1.0,1.3,1.5,1.5,1.8,1.8,2.0,2.0,1.8,1.8,1.5,1.5,1.3,1.3,1.0],"inflation":[3.5,3.0,2.8,2.5,2.5,2.3,2.2,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],"unemployment":[4.5,4.8,5.0,5.0,4.8,4.5,4.3,4.2,4.0,4.0,3.8,3.8,3.8,4.0,4.0,4.2],"conflict_last_year":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    "France":      {"gdp_growth":[1.0,1.2,1.5,1.8,2.0,2.0,2.2,2.2,2.0,2.0,1.8,1.8,1.5,1.5,1.3,1.3],"military_spend":[2.1,2.3,2.5,2.5,2.5,2.5,2.3,2.3,2.2,2.2,2.0,2.0,2.0,2.0,2.0,2.0],"working_age_pop":[62.0,61.8,61.5,61.3,61.0,60.8,60.5,60.3,60.0,59.8,59.5,59.3,59.0,58.8,58.5,58.3],"gdp_per_capita_growth":[0.5,0.8,1.0,1.3,1.5,1.5,1.8,1.8,1.5,1.5,1.3,1.3,1.0,1.0,0.8,0.8],"inflation":[2.5,2.3,2.2,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],"unemployment":[7.5,7.3,7.0,6.8,6.5,6.3,6.0,5.8,5.5,5.5,5.3,5.3,5.0,5.0,5.0,5.0],"conflict_last_year":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    "Pakistan":    {"gdp_growth":[2.5,3.0,3.5,4.0,4.5,4.5,5.0,5.0,4.8,4.5,4.5,4.2,4.2,4.0,4.0,3.8],"military_spend":[4.0,4.2,4.0,3.8,3.8,3.5,3.5,3.3,3.3,3.2,3.2,3.0,3.0,3.0,3.0,3.0],"working_age_pop":[60.0,60.5,61.0,61.5,62.0,62.5,63.0,63.5,64.0,64.5,65.0,65.5,66.0,66.5,67.0,67.5],"gdp_per_capita_growth":[0.5,1.0,1.5,2.0,2.5,2.5,3.0,3.0,2.8,2.5,2.5,2.3,2.3,2.0,2.0,1.8],"inflation":[25.0,20.0,15.0,12.0,10.0,9.0,8.0,7.5,7.0,6.5,6.0,6.0,5.5,5.5,5.0,5.0],"unemployment":[8.5,8.0,7.5,7.0,6.5,6.2,6.0,5.8,5.5,5.3,5.0,5.0,4.8,4.8,4.5,4.5],"conflict_last_year":[0.8,0.8,0.7,0.5,0.5,0.4,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1,0.0],"conflict_3yr_avg":[0.8,0.8,0.8,0.7,0.6,0.5,0.4,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1]},
    "Saudi Arabia":{"gdp_growth":[3.0,3.5,4.0,4.5,4.5,5.0,5.0,4.8,4.5,4.5,4.2,4.2,4.0,4.0,3.8,3.8],"military_spend":[6.0,5.8,5.5,5.2,5.0,4.8,4.5,4.3,4.0,4.0,3.8,3.8,3.5,3.5,3.3,3.3],"working_age_pop":[65.0,65.2,65.5,65.8,66.0,66.2,66.5,66.8,67.0,67.2,67.5,67.8,68.0,68.2,68.5,68.8],"gdp_per_capita_growth":[2.0,2.5,3.0,3.5,3.5,4.0,4.0,3.8,3.5,3.5,3.2,3.2,3.0,3.0,2.8,2.8],"inflation":[3.0,2.8,2.5,2.3,2.2,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0],"unemployment":[6.0,5.8,5.5,5.2,5.0,4.8,4.5,4.3,4.0,4.0,3.8,3.8,3.5,3.5,3.3,3.3],"conflict_last_year":[0.5,0.5,0.4,0.3,0.2,0.2,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.5,0.5,0.5,0.4,0.3,0.2,0.2,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0]},
    "Turkey":      {"gdp_growth":[3.0,3.5,4.0,4.5,4.5,4.8,5.0,5.0,4.8,4.5,4.5,4.2,4.2,4.0,4.0,3.8],"military_spend":[2.0,2.2,2.3,2.5,2.5,2.5,2.3,2.3,2.2,2.2,2.0,2.0,2.0,2.0,2.0,2.0],"working_age_pop":[67.0,67.2,67.5,67.8,68.0,68.2,68.5,68.8,69.0,69.2,69.5,69.8,70.0,70.2,70.5,70.8],"gdp_per_capita_growth":[2.0,2.5,3.0,3.5,3.5,3.8,4.0,4.0,3.8,3.5,3.5,3.2,3.2,3.0,3.0,2.8],"inflation":[65.0,45.0,30.0,20.0,15.0,12.0,10.0,8.0,7.0,6.0,5.5,5.0,5.0,4.5,4.5,4.0],"unemployment":[10.0,9.5,9.0,8.5,8.0,7.5,7.0,6.8,6.5,6.3,6.0,6.0,5.8,5.8,5.5,5.5],"conflict_last_year":[0.5,0.5,0.4,0.3,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.5,0.5,0.5,0.4,0.3,0.3,0.2,0.2,0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0]},
    "Indonesia":   {"gdp_growth":[5.0,5.2,5.5,5.5,5.8,5.8,6.0,6.0,5.8,5.8,5.5,5.5,5.3,5.3,5.0,5.0],"military_spend":[0.8,0.9,1.0,1.0,1.1,1.1,1.2,1.2,1.3,1.3,1.3,1.4,1.4,1.5,1.5,1.5],"working_age_pop":[67.0,67.3,67.5,67.8,68.0,68.2,68.5,68.8,69.0,69.2,69.5,69.8,70.0,70.2,70.5,70.8],"gdp_per_capita_growth":[4.0,4.2,4.5,4.5,4.8,4.8,5.0,5.0,4.8,4.8,4.5,4.5,4.3,4.3,4.0,4.0],"inflation":[3.5,3.3,3.0,3.0,2.8,2.8,2.5,2.5,2.5,2.3,2.3,2.2,2.2,2.0,2.0,2.0],"unemployment":[5.5,5.3,5.0,4.8,4.5,4.3,4.2,4.0,4.0,3.8,3.8,3.5,3.5,3.3,3.3,3.0],"conflict_last_year":[0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],"conflict_3yr_avg":[0.1,0.1,0.1,0.1,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]},
    "Afghanistan": {"gdp_growth":[-2.0,-1.5,-1.0,0.0,0.5,1.0,1.5,2.0,2.0,2.0,2.5,2.5,3.0,3.0,3.0,3.0],"military_spend":[0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5],"working_age_pop":[55.0,55.5,56.0,56.5,57.0,57.5,58.0,58.5,59.0,59.5,60.0,60.5,61.0,61.5,62.0,62.5],"gdp_per_capita_growth":[-3.0,-2.5,-2.0,-1.0,-0.5,0.5,1.0,1.5,1.5,1.5,2.0,2.0,2.5,2.5,2.5,2.5],"inflation":[20.0,18.0,15.0,12.0,10.0,8.0,7.0,6.0,6.0,5.5,5.0,5.0,4.5,4.5,4.0,4.0],"unemployment":[14.0,13.5,13.0,12.5,12.0,11.5,11.0,10.5,10.0,9.5,9.0,8.5,8.0,7.5,7.0,6.5],"conflict_last_year":[1.0,1.0,0.8,0.8,0.6,0.5,0.4,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1,0.1],"conflict_3yr_avg":[1.0,1.0,0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.3,0.2,0.2,0.2,0.1,0.1,0.1]},
}

YEARS = list(range(2025, 2041))

COUNTRY_META = {
    "USA":          {"region": "Americas",          "flag": "🇺🇸"},
    "Russia":       {"region": "Europe/Asia",        "flag": "🇷🇺"},
    "China":        {"region": "Asia",               "flag": "🇨🇳"},
    "India":        {"region": "Asia",               "flag": "🇮🇳"},
    "Iran":         {"region": "Middle East",        "flag": "🇮🇷"},
    "Israel":       {"region": "Middle East",        "flag": "🇮🇱"},
    "UK":           {"region": "Europe",             "flag": "🇬🇧"},
    "France":       {"region": "Europe",             "flag": "🇫🇷"},
    "Pakistan":     {"region": "Asia",               "flag": "🇵🇰"},
    "Saudi Arabia": {"region": "Middle East",        "flag": "🇸🇦"},
    "Turkey":       {"region": "Middle East/Europe", "flag": "🇹🇷"},
    "Indonesia":    {"region": "Asia",               "flag": "🇮🇩"},
    "Afghanistan":  {"region": "Asia",               "flag": "🇦🇫"},
}

def get_risk_level(prob):
    if prob >= 70: return "CRITICAL"
    if prob >= 50: return "HIGH"
    if prob >= 30: return "MODERATE"
    return "LOW"

def get_risk_color(prob):
    if prob >= 70: return "#ef4444"
    if prob >= 50: return "#f97316"
    if prob >= 30: return "#eab308"
    return "#22c55e"

@app.get("/")
def root():
    return {"status": "Geopolitical Risk API v6 — 13 countries + Scenarios"}

@app.get("/all-countries")
def all_countries():
    results = []
    for country, data in COUNTRY_DATA.items():
        row = [data[f][0] for f in FEATURES]
        proba = model.predict_proba([row])[0]
        prob = float(proba[1]) * 100 if len(proba) > 1 else 0.0
        results.append({
            "country": country,
            "flag": COUNTRY_META[country]["flag"],
            "region": COUNTRY_META[country]["region"],
            "risk_score": round(prob, 1),
            "risk_level": get_risk_level(prob),
            "risk_color": get_risk_color(prob),
        })
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return results

@app.get("/country/{country_name}")
def country_detail(country_name: str):
    if country_name not in COUNTRY_DATA:
        return {"error": "Country not found"}
    data = COUNTRY_DATA[country_name]
    forecast = []
    for i, year in enumerate(YEARS):
        row = [data[f][i] for f in FEATURES]
        proba = model.predict_proba([row])[0]
        prob = float(proba[1]) * 100 if len(proba) > 1 else 0.0
        forecast.append({
            "year": year,
            "risk_score": round(prob, 1),
            "risk_level": get_risk_level(prob),
            "gdp_growth": data["gdp_growth"][i],
            "military_spend": data["military_spend"][i],
            "inflation": data["inflation"][i],
            "unemployment": data["unemployment"][i],
        })
    current_risk = forecast[0]["risk_score"]

    rivals = df_dyadic[
        (df_dyadic['year'] == 2025) &
        ((df_dyadic['country_a'] == country_name) | (df_dyadic['country_b'] == country_name)) &
        (df_dyadic['conflict_probability'] > 0)
    ].copy()
    rivals['opponent'] = rivals.apply(
        lambda r: r['country_b'] if r['country_a'] == country_name else r['country_a'], axis=1
    )
    rivals = rivals.sort_values('conflict_probability', ascending=False).head(5)
    top_rivals = [
        {
            "country": row['opponent'],
            "flag": COUNTRY_META.get(row['opponent'], {}).get('flag', '🏳️'),
            "probability": row['conflict_probability'],
            "risk_level": get_risk_level(row['conflict_probability'])
        }
        for _, row in rivals.iterrows()
    ]

    return {
        "country": country_name,
        "flag": COUNTRY_META[country_name]["flag"],
        "region": COUNTRY_META[country_name]["region"],
        "current_risk": current_risk,
        "risk_level": get_risk_level(current_risk),
        "risk_color": get_risk_color(current_risk),
        "forecast": forecast,
        "key_indicators": {
            "gdp_growth": data["gdp_growth"][0],
            "military_spend": data["military_spend"][0],
            "inflation": data["inflation"][0],
            "unemployment": data["unemployment"][0],
        },
        "top_rivals": top_rivals
    }

@app.get("/rivalries")
def all_rivalries(year: int = 2025):
    data = df_dyadic[df_dyadic['year'] == year].copy()
    data = data.sort_values('conflict_probability', ascending=False)
    results = []
    for _, row in data.iterrows():
        results.append({
            "country_a": row['country_a'],
            "country_b": row['country_b'],
            "flag_a": COUNTRY_META.get(row['country_a'], {}).get('flag', '🏳️'),
            "flag_b": COUNTRY_META.get(row['country_b'], {}).get('flag', '🏳️'),
            "conflict_probability": row['conflict_probability'],
            "risk_level": get_risk_level(row['conflict_probability']),
            "risk_color": get_risk_color(row['conflict_probability']),
            "ever_fought": bool(row['ever_fought']),
            "same_region": bool(row['same_region']),
            "both_nuclear": bool(row['both_nuclear']),
            "year": year,
            "has_scenarios": f"{row['country_a']}_{row['country_b']}" in scenario_knowledge or f"{row['country_b']}_{row['country_a']}" in scenario_knowledge
        })
    return results

@app.get("/rivalries/pair/{country_a}/{country_b}")
def pair_forecast(country_a: str, country_b: str):
    mask = (
        ((df_dyadic['country_a'] == country_a) & (df_dyadic['country_b'] == country_b)) |
        ((df_dyadic['country_a'] == country_b) & (df_dyadic['country_b'] == country_a))
    )
    pair_data = df_dyadic[mask].sort_values('year')
    forecast = [
        {"year": int(row['year']), "probability": row['conflict_probability']}
        for _, row in pair_data.iterrows()
    ]
    current = pair_data[pair_data['year'] == 2025]
    current_prob = float(current['conflict_probability'].values[0]) if len(current) > 0 else 0.0

    # Check if scenarios exist
    has_scenarios = (
        f"{country_a}_{country_b}" in scenario_knowledge or
        f"{country_b}_{country_a}" in scenario_knowledge
    )

    return {
        "country_a": country_a,
        "country_b": country_b,
        "flag_a": COUNTRY_META.get(country_a, {}).get('flag', '🏳️'),
        "flag_b": COUNTRY_META.get(country_b, {}).get('flag', '🏳️'),
        "current_probability": current_prob,
        "risk_level": get_risk_level(current_prob),
        "forecast": forecast,
        "has_scenarios": has_scenarios
    }

@app.get("/scenarios/{country_a}/{country_b}/{year}")
def get_scenarios(country_a: str, country_b: str, year: int):
    key1 = f"{country_a}_{country_b}"
    key2 = f"{country_b}_{country_a}"

    if key1 in scenario_knowledge:
        data = scenario_knowledge[key1].get(str(year))
    elif key2 in scenario_knowledge:
        data = scenario_knowledge[key2].get(str(year))
    else:
        return {
            "error": "No scenario data for this pair",
            "pair": f"{country_a} vs {country_b}",
            "available_pairs": list(scenario_knowledge.keys())
        }

    if not data:
        return {"error": f"No data for year {year}"}

    return data

@app.get("/compare/{country1}/{country2}")
def compare(country1: str, country2: str):
    return {
        "country1": country_detail(country1),
        "country2": country_detail(country2),
    }