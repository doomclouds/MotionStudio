// SPDX-License-Identifier: Apache-2.0
// Original fictional content. No client, address, invoice ID, payment destination or actual transaction.
const freeze=rows=>Object.freeze(rows.map(Object.freeze));
export const examples=Object.freeze({
 workshop:Object.freeze({title:'FICTIONAL WORKSHOP / NOT PAYABLE',items:freeze([
  {title:'Sample color study',note:'A made-up study of warm and cool swatches for layout testing.',quantity:3,rateCents:12525},
  {title:'Example shape exercise',note:'Invented practice materials, not a deliverable or offer.',quantity:2,rateCents:4800}
 ]),rates:Object.freeze({retainerBps:1250,taxBps:275})}),
 archive:Object.freeze({title:'FICTIONAL ARCHIVE / NOT PAYABLE',items:freeze([
  {title:'Imaginary label sheets',note:'Synthetic rows demonstrate a different description and quantity.',quantity:7,rateCents:1033},
  {title:'Sample index exercise',note:'No shipment, purchase, tax obligation or receipt exists.',quantity:1,rateCents:24680},
  {title:'Zero-cost demonstration',note:'Zero cents is a supported arithmetic boundary, not a promotion.',quantity:2,rateCents:0}
 ]),rates:Object.freeze({retainerBps:0,taxBps:0})})
});
