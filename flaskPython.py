from flask import Flask, request, jsonify
import pandas as pd
import random

app = Flask(__name__)

# Load meal data from CSV (if needed)
meal_data = pd.read_csv("meals.csv")  # Ensure you have a meals.csv file

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        # Get user input
        data = request.get_json()
        age = int(data['age'])
        height = float(data['height'])
        weight = float(data['weight'])
        gender = data['gender']
        activity = data['activity']
        plan = data['plan']
        meals_per_day = int(data['meals'])

        # Calculate BMI
        bmi = round(weight / ((height / 100) ** 2), 2)

        # Estimate daily calorie needs based on activity level
        activity_factor = {"Little": 1.2, "Medium": 1.55, "Extreme": 1.9}
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + (5 if gender == "male" else -161)
        calories_needed = round(bmr * activity_factor[activity])

        # Generate meal recommendations from CSV
        recommendations = []
        for _ in range(meals_per_day):
            meal = meal_data.sample(1).iloc[0]
            recommendations.append({"meal": meal["Meal"], "calories": meal["Calories"]})

        return jsonify({
            "bmi": bmi,
            "calories_needed": calories_needed,
            "recommendations": recommendations
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
