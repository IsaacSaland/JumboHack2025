# -*- coding: utf-8 -*-
"""tiktokendemo

Automatically generated by Colab.


"""

import json
from datetime import datetime
from collections import Counter
import tiktoken
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter
import zipfile
import sys
import pandas as pd

def ttk(file_path):
    print("we are in tiktoken file")

    # Path where you want to extract the file
    extract_path = 'jsonfiles'

    # Open the zip file
    with zipfile.ZipFile(file_path, 'r') as zip_ref:
        # Extract the specific file
        zip_ref.extract('conversations.json', extract_path)

    # below green line

    print("Opening the converstions json")
    # Load JSON file
    with open('jsonfiles/conversations.json', 'r') as file:
        data = json.load(file)

    # Recursive function to extract "parts" values
    def extract_parts(obj, parts_list):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == "parts" and isinstance(value, list):  # Ensure "parts" is a list
                    parts_list.extend(value)
                else:
                    extract_parts(value, parts_list)
        elif isinstance(obj, list):
            for item in obj:
                extract_parts(item, parts_list)

    # Extract "parts"
    parts_list = []
    extract_parts(data, parts_list)

    # Print the extracted list of "parts"
    print(parts_list)

    # just remove all the new lines and tabs since formatting does not count in the token count
    def filter_parts(parts_list):
        """Filter out '\n' and ' ' characters from each string in parts_list"""
        filtered_list = []
        for part in parts_list:
            if isinstance(part, str):
                # Remove '\n' and ' ' characters
                filtered_part = part.replace('\n', '').replace('\t', '')
                # Only add non-empty strings to the filtered list
                if filtered_part:
                    filtered_list.append(filtered_part)
            else:
                # Keep non-string values as they are
                filtered_list.append(part)
        return filtered_list

    filtered_parts_list = filter_parts(parts_list)
    print(len(filtered_parts_list))

    def count_tokens(prompt, model="gpt-4"):
        enc = tiktoken.encoding_for_model(model)
        return len(enc.encode(prompt))

    # Apply filtering
    filtered_parts_list = filter_parts(parts_list)

    # Ensure all elements are strings before tokenization
    token_counts = [count_tokens(str(part)) for part in filtered_parts_list]

    # Calculate total token count
    total_tokens = sum(token_counts)

    # Print results
    print("Token counts per part:", len(token_counts))
    print("Total number of tokens:", total_tokens)

    def extract_timestamps(obj, timestamps_list):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == "create_time" and isinstance(value, (int, float)):  # Ensure it's a valid timestamp
                    timestamps_list.append(value)
                else:
                    extract_timestamps(value, timestamps_list)
        elif isinstance(obj, list):
            for item in obj:
                extract_timestamps(item, timestamps_list)

    # Extract "create_time" timestamps
    timestamps_list = []
    extract_timestamps(data, timestamps_list)

    readable_timestamps = [datetime.fromtimestamp(ts).strftime("%m%d%Y") for ts in timestamps_list]

    # Print the result
    print((readable_timestamps))

    # Count the frequency of each timestamp
    timestamp_counts = Counter(readable_timestamps)

    # Convert to a list of (timestamp, frequency) tuples
    timestamp_frequencies = list(timestamp_counts.items())

    # Find the highest frequency
    highest_frequency = max(timestamp_frequencies, key=lambda x: x[1])

    # Print the result
    print(highest_frequency)  # (timestamp, frequency)

    """According to statistics,
        15 ChatGPT queries equate to the CO2 emissions of watching one hour of video 
        streaming.

        139 queries are roughly equivalent to the emissions from one load of laundry 
        washed and dried on a clothesline.

        For frequent flyers, 92,593 queries would match the carbon footprint of a round-trip flight from San Francisco to Seattle​ (Piktochart)​.
    But we want a statistic that is more prompt specific --> that is where analysis via token counts come into play. Tokens correspond into FLOP computations which contribute into research costs per model.

    https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use?utm_source=chatgpt.com

    200 billion (2*10^11) FLOP are needed to generate one token

    so to calculate Joules consumed we will take FLOPS / FLOPS / token

    However, we see little change in the average energy
    per token between max generation length 512 and 1024. For
    instance, with length 512, we see that it takes about 4 Joules
    for a output token, which is approximately the same amount
    for length 512.

    https://arxiv.org/pdf/2310.03003

    Relavant information
    500 mL of water was consumed to respond to 10–50 queries in ChatGPT services

    A Google search uses about 0.0003 kWh
    """

    # TO DO: find the cost in energy consumption using given formula
    # This is the math section of the project where we calculate the cost in energy consumption of the project

    JOULESPERTOKEN = 4

    total_joules = sum(token_counts) * JOULESPERTOKEN
    print("Total Joules: " + str(total_joules))

    joules_per_query = total_joules / len(filtered_parts_list)
    print("Joules per query: " + str(joules_per_query))

    def aggregate_frequencies(timestamp_frequencies, time_unit='day'):
        """
        Aggregate frequencies by specified time unit (day, month, or year)

        Args:
            timestamp_frequencies: List of tuples with (mmddyyyy, frequency)
            time_unit: 'day', 'month', or 'year'

        Returns:
            DataFrame with aggregated frequencies
        """
        # Convert to DataFrame
        df = pd.DataFrame(timestamp_frequencies, columns=['date', 'frequency'])

        # Convert string dates to datetime
        df['date'] = pd.to_datetime(df['date'], format='%m%d%Y')

        if time_unit == 'day':
            # Format as mmddyyyy
            df['period'] = df['date'].dt.strftime('%m%d%Y')
        elif time_unit == 'month':
            # Format as mmyyyy
            df['period'] = df['date'].dt.strftime('%m%Y')
        elif time_unit == 'year':
            # Format as yyyy
            df['period'] = df['date'].dt.strftime('%Y')
        else:
            raise ValueError("time_unit must be 'day', 'month', or 'year'")

        # Group by the period and sum frequencies
        aggregated = df.groupby('period')['frequency'].sum().reset_index()

        # Sort by period
        aggregated = aggregated.sort_values('period')

        return aggregated

    def get_daily_frequencies(timestamp_frequencies):
        """Get frequencies aggregated by day"""
        return aggregate_frequencies(timestamp_frequencies, 'day')

    def get_monthly_frequencies(timestamp_frequencies):
        """Get frequencies aggregated by month"""
        return aggregate_frequencies(timestamp_frequencies, 'month')

    def get_yearly_frequencies(timestamp_frequencies):
        """Get frequencies aggregated by year"""
        return aggregate_frequencies(timestamp_frequencies, 'year')

    daily_frequencies = get_daily_frequencies(timestamp_frequencies)
    monthly_frequencies = get_monthly_frequencies(timestamp_frequencies)
    yearly_frequencies = get_yearly_frequencies(timestamp_frequencies)


    def compute_energy_consumption(time_frequencies):
        # Convert timestamps to datetime and create a DataFrame
        df = pd.DataFrame(time_frequencies, columns=['date', 'frequency'])

        # Convert frequency to energy consumption (joules)
        df['energy_joules'] = df['frequency'] * 4

        # Convert string dates to datetime
        df['date'] = pd.to_datetime(df['date'], format='%m%d%Y')

        # Convert back to mmddyyyy format
        df['date'] = df['date'].dt.strftime('%m%d%Y')

        # Return a list of tuples (date in mmddyyyy, energy in joules)
        return list(df.itertuples(index=False, name=None))

    df_daily = compute_energy_consumption(daily_frequencies)
    df_monthly = compute_energy_consumption(monthly_frequencies)
    df_yearly = compute_energy_consumption(yearly_frequencies)

    return total_joules, df_daily, df_monthly, df_yearly
    # def plot_energy_consumption(time_frequencies):
    #     # Convert timestamps to datetime and create a DataFrame
    #     df = pd.DataFrame(time_frequencies, columns=['date', 'frequency'])

    #     # Convert frequency to energy consumption (joules)
    #     df['energy_joules'] = df['frequency'] * 4

    #     # Convert string dates to datetime
    #     df['date'] = pd.to_datetime(df['date'], format='%m%d%Y')

    #     # Create month-year string and group by it
    #     df['month_year'] = df['date'].dt.strftime('%m-%Y')
    #     monthly_totals = df.groupby('month_year')['energy_joules'].sum().reset_index()

    #     # Sort by actual date to ensure chronological order
    #     monthly_totals['sort_date'] = pd.to_datetime(monthly_totals['month_year'], format='%m-%Y')
    #     monthly_totals = monthly_totals.sort_values('sort_date')

    #     # Create the plot
    #     plt.figure(figsize=(12, 6))
    #     bars = plt.bar(monthly_totals['month_year'], monthly_totals['energy_joules'])

    #     # Customize the plot
    #     plt.xticks(rotation=45, ha='right')
    #     plt.xlabel('Month-Year')
    #     plt.ylabel('Energy Consumption (Joules)')
    #     plt.title('Monthly Energy Consumption Distribution')

    #     # Add grid for better readability
    #     plt.grid(axis='y', linestyle='--', alpha=0.7)

    #     # Adjust layout to prevent label cutoff
    #     plt.tight_layout()

    #     return plt

    # Use the function
    # monthly_energy = plot_energy_consumption(timestamp_frequencies)
    # monthly_energy.show()

    

    # monthly_frequencies

    # def process_energy_consumption(frequencies, joules_per_query):
    #     """
    #     Process frequency data and calculate energy consumption

    #     Args:
    #         frequencies: DataFrame with columns ['period', 'frequency']
    #         joules_per_query: Energy consumption per query in joules

    #     Returns:
    #         dates: List of formatted dates
    #         energy_values: List of energy consumption values
    #         time_unit: Automatically detected time unit (Day/Month/Year)
    #     """
    #     dates = []
    #     energy_values = []

    #     # Ensure we have a DataFrame
    #     if not isinstance(frequencies, pd.DataFrame):
    #         raise ValueError("Input must be a pandas DataFrame")

    #     # Get sample period from first row
    #     sample_period = str(frequencies.iloc[0]['period'])

    #     # Determine the time unit and format based on period structure
    #     if len(sample_period) == 8:  # mmddyyyy
    #         date_format = '%m%d%Y'
    #         time_unit = 'Day'
    #     elif len(sample_period) == 6:  # mmyyyy
    #         date_format = '%m%Y'
    #         time_unit = 'Month'
    #     else:  # yyyy
    #         date_format = '%Y'
    #         time_unit = 'Year'

    #     # Process each row
    #     for _, row in frequencies.iterrows():
    #         period = str(row['period'])
    #         freq = float(row['frequency'])

    #         # Convert period string to datetime
    #         date = datetime.strptime(period, date_format)

    #         # Calculate energy consumption
    #         energy = freq * joules_per_query

    #         dates.append(date)
    #         energy_values.append(energy)

    #     return dates, energy_values, time_unit

    # def plot_energy_histogram(dates, energy_values, time_unit):
    #     plt.figure(figsize=(10, 6))

    #     # Set bar width based on time unit
    #     if time_unit == 'Day':
    #         width = 1  # Default width for daily data
    #     elif time_unit == 'Month':
    #         width = 20  # Wider bars for monthly data
    #     elif time_unit == 'Year':
    #         width = 200  # Even wider bars for yearly data

    #     plt.bar(dates, energy_values, width=width, color='blue')  # Set the width parameter
    #     plt.xlabel('Date')
    #     plt.ylabel('Energy Consumption (Joules)')
    #     plt.title(f'Energy Consumption per {time_unit}')

    #     # Format dates on x-axis based on time unit
    #     if time_unit == 'Day':
    #         plt.gca().xaxis.set_major_formatter(DateFormatter('%m/%d/%Y'))
    #     elif time_unit == 'Month':
    #         plt.gca().xaxis.set_major_formatter(DateFormatter('%m/%Y'))
    #     elif time_unit == 'Year':
    #         plt.gca().xaxis.set_major_formatter(DateFormatter('%Y'))

    #     plt.xticks(rotation=45)
    #     plt.tight_layout()
    #     plt.show()

    # Example usage
    # daily_frequency_energy = process_energy_consumption(daily_frequencies, joules_per_query)
    # monthly_frequency_energy = process_energy_consumption(monthly_frequencies, joules_per_query)
    # yearly_frequency_energy = process_energy_consumption(yearly_frequencies, joules_per_query)

    # daily_frequency_energy_plt = plot_energy_histogram(*daily_frequency_energy)
    # monthly_frequency_energy_plt = plot_energy_histogram(*monthly_frequency_energy)
    # yearly_frequency_energy_plt = plot_energy_histogram(*yearly_frequency_energy)