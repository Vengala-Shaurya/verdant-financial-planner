def validate_expense(data):
    errors = []
    if 'amount' not in data or data['amount'] is None:
        errors.append("Amount is required")
    else:
        try:
            amt = float(data['amount'])
            if amt <= 0:
                errors.append("Amount must be greater than zero")
        except ValueError:
            errors.append("Amount must be a valid number")
            
    if not data.get('category') or not str(data['category']).strip():
        errors.append("Category is required")
        
    if not data.get('date') or not str(data['date']).strip():
        errors.append("Date is required")
        
    return errors

def validate_goal(data):
    errors = []
    if not data.get('name') or not str(data['name']).strip():
        errors.append("Goal name is required")
        
    if 'target_amount' not in data or data['target_amount'] is None:
        errors.append("Target amount is required")
    else:
        try:
            amt = float(data['target_amount'])
            if amt <= 0:
                errors.append("Target amount must be greater than zero")
        except ValueError:
            errors.append("Target amount must be a valid number")
            
    if not data.get('target_date') or not str(data['target_date']).strip():
        errors.append("Target date is required")
        
    return errors

def validate_profile(data):
    errors = []
    if not data.get('name') or not str(data['name']).strip():
        errors.append("Name is required")
        
    for field in ['monthly_income', 'fixed_expenses', 'variable_expenses', 'existing_savings', 'debt_obligations']:
        if field in data and data[field] is not None:
            try:
                val = float(data[field])
                if val < 0:
                    errors.append(f"{field.replace('_', ' ').capitalize()} cannot be negative")
            except ValueError:
                errors.append(f"{field.replace('_', ' ').capitalize()} must be a valid number")
                
    return errors
