You are a senior Full-Stack Software Engineer and UI/UX Designer.

Update the existing Dairy Laboratory Management System with the following features and business logic without breaking any existing functionality. Maintain a clean architecture, responsive design, and professional UI.

Requirements:

1. Account Statement
- Replace the "Total Milk" field with a new field called "Quantity".
- Wherever the account statement displays total milk, it should now display the quantity instead.
- Ensure all calculations continue to work correctly.

2. Sales Module
- Add an Edit icon/button for every sales record.
- Users should be able to edit any sales transaction.
- The Print command must always print the updated data after editing.

3. External Expenses
- Add an Edit icon/button for every external expense.
- Users must be able to modify expense details without deleting and recreating the record.

4. Buyers Management
- Allow editing of buyer information.
- Editable fields include buyer name, phone number, address, notes, and any related information.
- Ensure changes are reflected throughout the system.

5. Laboratory Purchases
- Add a new menu/module called "Laboratory Purchases".
- This module is dedicated to purchases made specifically for the laboratory.
- Include:
  - Add Purchase
  - Edit Purchase
  - Delete Purchase
  - Search
  - Print
- Store purchase date, supplier, item name, quantity, unit price, total price, and notes.

6. Account Statement Quantity
- Replace the existing milk icon/label in the Account Statement with "Quantity".
- All reports and calculations must use the quantity field consistently.

7. Weekly Milk Price Lock
- When the milk price is changed for the first time during a week, that price becomes the default price for the entire current week.
- The system must automatically use the same price for all milk receipts during that week.
- Users should NOT be asked to enter the milk price again during the same week.
- The price can only be changed again when a new week begins.
- Weekly calculation should reset automatically based on the system date.

8. Milk Receiving and Daily Distribution
When receiving milk:
- Save the quantity received.
- Save the price per kilogram.
- Automatically calculate the total amount.

Daily distribution reports must use these values.

When printing the daily distribution report, display the following columns:

---------------------------------------------------------
Milk Quantity | Price per Kilogram | Total Amount
---------------------------------------------------------

Where:
Total Amount = Milk Quantity × Price per Kilogram

Additional Requirements:
- Preserve all existing data.
- Maintain backward compatibility.
- Validate all user inputs.
- Keep calculations accurate.
- Use clean and maintainable code.
- Optimize database queries.
- Ensure mobile responsiveness.
- Ensure all reports and print layouts reflect the new changes.
- Test all modules after implementation to ensure there are no regressions or broken functionality.
