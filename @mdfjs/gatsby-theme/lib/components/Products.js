"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const react_i18next_1 = require("react-i18next");
const Product_1 = __importDefault(require("./Product"));
const getProducts_1 = require("./getProducts");
const hooks_1 = require("../hooks");
const Product_module_less_1 = __importDefault(require("./Product.module.less"));
const Products = ({ show, rootDomain = '', language, className, }) => {
    const { t, i18n } = react_i18next_1.useTranslation();
    const [isChinaMirrorHost] = hooks_1.useChinaMirrorHost();
    const data = getProducts_1.getProducts({
        t,
        language: language || i18n.language,
        rootDomain,
        isChinaMirrorHost,
    });
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: classnames_1.default(Product_module_less_1.default.products, className, {
                [Product_module_less_1.default.show]: !!show,
            }) },
            react_1.default.createElement("div", { className: Product_module_less_1.default.container },
                react_1.default.createElement("h3", null, t('基础产品')),
                react_1.default.createElement("ul", null, data
                    .filter((item) => item.category === 'basic')
                    .map((product) => (react_1.default.createElement(Product_1.default, { key: product.title, name: product.title, slogan: product.slogan || '', description: product.description, url: (product.links || [])[0].url, icon: product.icon, links: product.links, language: language || i18n.language })))),
                react_1.default.createElement("h3", null, t('拓展产品')),
                react_1.default.createElement("ul", null, data
                    .filter((item) => item.category === 'extension')
                    .map((product) => (react_1.default.createElement(Product_1.default, { key: product.title, name: product.title, slogan: product.slogan || '', description: product.description, url: (product.links || [])[0].url, icon: product.icon, links: product.links, language: language || i18n.language })))),
                react_1.default.createElement("h3", null, t('周边生态')),
                react_1.default.createElement("ul", null, data
                    .filter((item) => item.category === 'ecology')
                    .map((product) => (react_1.default.createElement(Product_1.default, { key: product.title, name: product.title, slogan: product.slogan || '', description: product.description, url: (product.links || [])[0].url, icon: product.icon, language: language || i18n.language })))))),
        react_1.default.createElement("div", { className: Product_module_less_1.default.mask })));
};
exports.default = Products;
