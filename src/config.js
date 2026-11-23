// Rename the shop in one place. (Settings can also override it at runtime.)
export const SHOP_NAME = 'PrintFlow';

// Name used in the welcome message and in stage history ("by").
export const CURRENT_USER = 'Sarah';

export const DEFAULT_SETTINGS = {
  shopName: SHOP_NAME,
  userName: CURRENT_USER,
  dailyCapacity: 300, // prints per day
  workingDays: 5, // used for weekly capacity (Mon–Fri)
  workStart: 8, // hour, 24h
  workEnd: 18,
};

export const ASSIGNEES = ['Vincent', 'Maya', 'Jordan', 'Priya'];

export const PRINT_METHODS = ['Screen print', 'DTG', 'Embroidery', 'Heat transfer', 'DTF'];

export const GARMENTS = ['T-shirt', 'Hoodie', 'Crewneck', 'Hat', 'Tote bag', 'Polo', 'Tank top'];

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'OS'];

export const SUPPLIERS = ['SanMar', 'S&S Activewear', 'alphabroder'];
