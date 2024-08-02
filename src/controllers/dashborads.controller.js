const prisma = require("../db");

const getCommercialGroupByCompay = async (req, res) => {
  const { company } = req.query;

  try {
    const planes = await prisma.data_plan.findMany({
      select: { id: true, mb_plan: true },
    });

    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        commercial_group: true,
        serial_number: true,
        service_provider: true,
        data_plan_id: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    const consmptionSimFunction = async (serial_number, planId) => {
      try {
        const findPlan = planes.find((el) => el.id === planId);
        const response = await prisma.sim_summary.findFirst({
          where: {
            summary_icc: serial_number,
          },
          orderBy: {
            summary_date: "desc",
          },
          select: {
            consumption_monthly_data_val: true,
            summary_icc: true,
            commercial_group: true,
          },
        });

        return { ...response, plan: findPlan };
      } catch (error) {
        console.log(error);
      }
    };

    const uniqueCommercialGroups = [...new Set(sims.map((item) => item.commercial_group))];

    const consumptionSim = await Promise.all(
      sims.map((el) => consmptionSimFunction(el.serial_number, el.data_plan_id))
    );

    const consumpitonByCommercialGroupFunction = (data) => {
      const totals = uniqueCommercialGroups.map((group) => ({
        commercial_group: group,
        monthlyConsumption: 0,
        mb_totales: 0,
        sim_count: 0,
      }));

      data.forEach((el) => {
        const group = totals.find((g) => g.commercial_group === el.commercial_group);
        if (group) {
          group.monthlyConsumption += el.consumption_monthly_data_val || 0;
          group.mb_totales += el.plan.mb_plan || 0;
          group.sim_count += 1;
        }
      });

      return totals;
    };

    const consumpitonByCommercialGroup = consumpitonByCommercialGroupFunction(consumptionSim);

    res
      .status(200)
      .send({ commercial_group: uniqueCommercialGroups, consumptions: consumptionSim, consumpitonByCommercialGroup });
  } catch (error) {
    res.status(400).send(error);
  }
};

const getOperation = async (req, res) => {
  const { company } = req.query;

  try {
    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        commercial_group: true,
        serial_number: true,
        service_provider: true,
        data_plan_id: true,
        status: true,
        sim_global: true,
        until_date: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    const simsLegacy = await prisma.sim_legacy.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        serial_number: true,
        service_provider: true,
        data_plan_id: true,
        status: true,
      },
      orderBy: {
        data_plan_id: "asc",
      },
    });

    res.status(200).send([...sims, ...simsLegacy]);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const getInformation = async (req, res) => {
  const { company } = req.query;

  try {
    const sims = await prisma.sim.findMany({
      where: {
        company: parseInt(company),
      },
      select: {
        country: true,
        serial_number: true,
      },
      orderBy: {
        commercial_group: "asc",
      },
    });

    const countryMap = {
      AF: "Afghanistan",
      AX: "Åland Islands",
      AL: "Albania",
      DZ: "Algeria",
      AS: "American Samoa",
      AD: "Andorra",
      AO: "Angola",
      AI: "Anguilla",
      AQ: "Antarctica",
      AG: "Antigua and Barbuda",
      AR: "Argentina",
      AM: "Armenia",
      AW: "Aruba",
      AU: "Australia",
      AT: "Austria",
      AZ: "Azerbaijan",
      BS: "Bahamas",
      BH: "Bahrain",
      BD: "Bangladesh",
      BB: "Barbados",
      BY: "Belarus",
      BE: "Belgium",
      BZ: "Belize",
      BJ: "Benin",
      BM: "Bermuda",
      BT: "Bhutan",
      BO: "Bolivia (Plurinational State of)",
      BQ: "Bonaire, Sint Eustatius and Saba",
      BA: "Bosnia and Herzegovina",
      BW: "Botswana",
      BV: "Bouvet Island",
      BR: "Brazil",
      IO: "British Indian Ocean Territory",
      BN: "Brunei Darussalam",
      BG: "Bulgaria",
      BF: "Burkina Faso",
      BI: "Burundi",
      CV: "Cabo Verde",
      KH: "Cambodia",
      CM: "Cameroon",
      CA: "Canada",
      KY: "Cayman Islands",
      CF: "Central African Republic",
      TD: "Chad",
      CL: "Chile",
      CN: "China",
      CX: "Christmas Island",
      CC: "Cocos (Keeling) Islands",
      CO: "Colombia",
      KM: "Comoros",
      CG: "Congo",
      CD: "Congo (Democratic Republic of the)",
      CK: "Cook Islands",
      CR: "Costa Rica",
      HR: "Croatia",
      CU: "Cuba",
      CW: "Curaçao",
      CY: "Cyprus",
      CZ: "Czechia",
      DK: "Denmark",
      DJ: "Djibouti",
      DM: "Dominica",
      DO: "Dominican Republic",
      EC: "Ecuador",
      EG: "Egypt",
      SV: "El Salvador",
      GQ: "Equatorial Guinea",
      ER: "Eritrea",
      EE: "Estonia",
      SZ: "Eswatini",
      ET: "Ethiopia",
      FK: "Falkland Islands (Malvinas)",
      FO: "Faroe Islands",
      FJ: "Fiji",
      FI: "Finland",
      FR: "France",
      GF: "French Guiana",
      PF: "French Polynesia",
      TF: "French Southern Territories",
      GA: "Gabon",
      GM: "Gambia",
      GE: "Georgia",
      DE: "Germany",
      GH: "Ghana",
      GI: "Gibraltar",
      GR: "Greece",
      GL: "Greenland",
      GD: "Grenada",
      GP: "Guadeloupe",
      GU: "Guam",
      GT: "Guatemala",
      GG: "Guernsey",
      GN: "Guinea",
      GW: "Guinea-Bissau",
      GY: "Guyana",
      HT: "Haiti",
      HM: "Heard Island and McDonald Islands",
      VA: "Holy See",
      HN: "Honduras",
      HK: "Hong Kong",
      HU: "Hungary",
      IS: "Iceland",
      IN: "India",
      ID: "Indonesia",
      IR: "Iran (Islamic Republic of)",
      IQ: "Iraq",
      IE: "Ireland",
      IM: "Isle of Man",
      IL: "Israel",
      IT: "Italy",
      JM: "Jamaica",
      JP: "Japan",
      JE: "Jersey",
      JO: "Jordan",
      KZ: "Kazakhstan",
      KE: "Kenya",
      KI: "Kiribati",
      KP: "Korea (Democratic People's Republic of)",
      KR: "Korea (Republic of)",
      KW: "Kuwait",
      KG: "Kyrgyzstan",
      LA: "Lao People's Democratic Republic",
      LV: "Latvia",
      LB: "Lebanon",
      LS: "Lesotho",
      LR: "Liberia",
      LY: "Libya",
      LI: "Liechtenstein",
      LT: "Lithuania",
      LU: "Luxembourg",
      MO: "Macao",
      MG: "Madagascar",
      MW: "Malawi",
      MY: "Malaysia",
      MV: "Maldives",
      ML: "Mali",
      MT: "Malta",
      MH: "Marshall Islands",
      MQ: "Martinique",
      MR: "Mauritania",
      MU: "Mauritius",
      YT: "Mayotte",
      MX: "Mexico",
      FM: "Micronesia (Federated States of)",
      MD: "Moldova (Republic of)",
      MC: "Monaco",
      MN: "Mongolia",
      ME: "Montenegro",
      MS: "Montserrat",
      MA: "Morocco",
      MZ: "Mozambique",
      MM: "Myanmar",
      NA: "Namibia",
      NR: "Nauru",
      NP: "Nepal",
      NL: "Netherlands",
      NC: "New Caledonia",
      NZ: "New Zealand",
      NI: "Nicaragua",
      NE: "Niger",
      NG: "Nigeria",
      NU: "Niue",
      NF: "Norfolk Island",
      MP: "Northern Mariana Islands",
      NO: "Norway",
      OM: "Oman",
      PK: "Pakistan",
      PW: "Palau",
      PS: "Palestine, State of",
      PA: "Panama",
      PG: "Papua New Guinea",
      PY: "Paraguay",
      PE: "Peru",
      PH: "Philippines",
      PN: "Pitcairn",
      PL: "Poland",
      PT: "Portugal",
      PR: "Puerto Rico",
      QA: "Qatar",
      MK: "Republic of North Macedonia",
      RO: "Romania",
      RU: "Russian Federation",
      RW: "Rwanda",
      RE: "Réunion",
      BL: "Saint Barthélemy",
      SH: "Saint Helena, Ascension and Tristan da Cunha",
      KN: "Saint Kitts and Nevis",
      LC: "Saint Lucia",
      MF: "Saint Martin (French part)",
      PM: "Saint Pierre and Miquelon",
      VC: "Saint Vincent and the Grenadines",
      WS: "Samoa",
      SM: "San Marino",
      ST: "Sao Tome and Principe",
      SA: "Saudi Arabia",
      SN: "Senegal",
      RS: "Serbia",
      SC: "Seychelles",
      SL: "Sierra Leone",
      SG: "Singapore",
      SX: "Sint Maarten (Dutch part)",
      SK: "Slovakia",
      SI: "Slovenia",
      SB: "Solomon Islands",
      SO: "Somalia",
      ZA: "South Africa",
      GS: "South Georgia and the South Sandwich Islands",
      SS: "South Sudan",
      ES: "Spain",
      LK: "Sri Lanka",
      SD: "Sudan",
      SR: "Suriname",
      SJ: "Svalbard and Jan Mayen",
      SE: "Sweden",
      CH: "Switzerland",
      SY: "Syrian Arab Republic",
      TW: "Taiwan, Province of China",
      TJ: "Tajikistan",
      TZ: "Tanzania, United Republic of",
      TH: "Thailand",
      TL: "Timor-Leste",
      TG: "Togo",
      TK: "Tokelau",
      TO: "Tonga",
      TT: "Trinidad and Tobago",
      TN: "Tunisia",
      TR: "Turkey",
      TM: "Turkmenistan",
      TC: "Turks and Caicos Islands",
      TV: "Tuvalu",
      UG: "Uganda",
      UA: "Ukraine",
      AE: "United Arab Emirates",
      GB: "United Kingdom of Great Britain and Northern Ireland",
      US: "United States of America",
      UM: "United States Minor Outlying Islands",
      UY: "Uruguay",
      UZ: "Uzbekistan",
      VU: "Vanuatu",
      VE: "Venezuela (Bolivarian Republic of)",
      VN: "Viet Nam",
      VG: "Virgin Islands (British)",
      VI: "Virgin Islands (U.S.)",
      WF: "Wallis and Futuna",
      EH: "Western Sahara",
      YE: "Yemen",
      ZM: "Zambia",
      ZW: "Zimbabwe",
    };

    const countries = [
      ...new Set(
        sims.map((el) => {
          return countryMap[el.country] || "Unknown Country"; // Maneja el caso de países no encontrados
        })
      ),
    ];

    const getConsumptionSims = async (serial_number, country) => {
      let sim = await prisma.sim_summary.findFirst({
        where: {
          summary_icc: serial_number,
        },
        orderBy: {
          summary_date: "desc",
        },
        select: {
          summary_icc: true,
          consumption_monthly_data_val: true,
          consumption_monthly_sms_val: true,
          consumption_monthly_voice_val: true,
        },
      });
      return {
        ...sim,
        country,
      };
    };

    const consumptionResponse = await Promise.all(sims.map((el) => getConsumptionSims(el.serial_number, el.country)));

    let countryArray = Object.entries(countryMap).map(([sigles, country]) => ({
      country,
      sigles,
      data: 0,
      sms: 0,
      voice: 0,
    }));

    consumptionResponse.forEach((el) => {
      let find = countryArray.find((country) => country.sigles === el.country);
      if (find) {
        find = {
          ...find,
          data: (find.data += el.consumption_monthly_data_val),
          sms: (find.sms += el.consumption_monthly_sms_val),
          voice: (find.voice += el.consumption_monthly_voice_val),
        };
      }
    });

    res.status(200).send({ countries, countriesData: countryArray });
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

module.exports = { getCommercialGroupByCompay, getOperation, getInformation };
