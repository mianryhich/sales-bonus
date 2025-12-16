/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discountMultiplier = 1 - (purchase.discount / 100);
   const revenue = purchase.sale_price * purchase.quantity * discountMultiplier;
   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    let bonus;
    
    if (index === 0) {
        bonus = seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        bonus = seller.profit * 0.10;
    } else if (index === total - 1) {
        bonus = 0;
    } else {
        bonus = seller.profit * 0.05;
    }

    return Number(bonus.toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!data
        || !data.sellers || !data.products || !data.purchase_records
        || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0 || data.products.length === 0 || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций

    if (!options || typeof options !== 'object') {
        throw new Error('Опции должны быть объектом');
    }
    
    const { calculateRevenue, calculateBonus } = options;
    
    if (!calculateRevenue || !calculateBonus) {
        throw new Error('В опциях должны быть функции calculateRevenue и calculateBonus');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

        const sellerStatsMap = new Map();
    sellerStats.forEach(stat => {
        sellerStatsMap.set(stat.id, stat);
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    const sellerIndex = sellerStats.reduce((index, stat) => {
        index[stat.id] = stat;
        return index;
    }, {});

    const productIndex = data.products.reduce((index, product) => {
        index[product.sku] = product;
        return index;
    }, {});


    // @TODO: Расчет выручки и прибыли для каждого продавца

    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];

        if (!seller) {
            console.warn(`Продавец с ID ${record.seller_id} не найден`);
            return;
        }

        seller.sales_count += 1;

        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];

            if (!product) {
                console.warn(`Товар с SKU ${item.sku} не найден`);
                return;
            }

            const itemRevenue = calculateRevenue(item, product);

            const itemCost = product.purchase_price * item.quantity;

            const itemProfit = itemRevenue - itemCost;

            seller.profit += itemProfit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли

    sellerStats.sort((sellerA, sellerB) => {
        return sellerB.profit - sellerA.profit;
    });
    

    // @TODO: Назначение премий на основе ранжирования

    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller);

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku: sku,
                quantity: quantity
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями

    const result = sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));

    return result;
}
