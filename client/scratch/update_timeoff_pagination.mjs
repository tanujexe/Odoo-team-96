import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/features/time-off/index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Pagination import
if (!content.includes("import { Pagination }")) {
  content = content.replace(
    "import { LoadingState, EmptyState } from '../../components/ui/States';",
    "import { LoadingState, EmptyState } from '../../components/ui/States';\nimport { Pagination } from '../../components/ui/Pagination';"
  );
}

// 2. Add pagination states into TimeOffFeature
if (!content.includes("const [reqPage, setReqPage]")) {
  content = content.replace(
    "const [typeFilter, setTypeFilter] = useState('All');",
    `const [typeFilter, setTypeFilter] = useState('All');

  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [allocPage, setAllocPage] = useState(1);
  const [allocPageSize, setAllocPageSize] = useState(10);
  const [typesPage, setTypesPage] = useState(1);
  const [typesPageSize, setTypesPageSize] = useState(10);`
  );
}

// 3. Update Allocations list rendering
content = content.replace(
  "const filteredAllocations = MOCK_ALLOCATIONS.filter",
  `const filteredAllocations = MOCK_ALLOCATIONS.filter`
);

content = content.replace(
  "{filteredAllocations.map((al, idx) => {",
  `{filteredAllocations.slice((allocPage - 1) * allocPageSize, allocPage * allocPageSize).map((al, idx) => {`
);

content = content.replace(
  "              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n    );\n  }\n\n  /* ──────────────────────────────────────────────────────────\n     VIEW 4: ALLOCATION FORM VIEW",
  `              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={allocPage}
            totalRecords={filteredAllocations.length}
            pageSize={allocPageSize}
            onPageChange={(p) => setAllocPage(p)}
            onPageSizeChange={(s) => { setAllocPageSize(s); setAllocPage(1); }}
          />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     VIEW 4: ALLOCATION FORM VIEW`
);

// 4. Update Time Off Types list rendering
content = content.replace(
  "{MOCK_TIME_OFF_TYPES.map((tot) => (",
  `{MOCK_TIME_OFF_TYPES.slice((typesPage - 1) * typesPageSize, typesPage * typesPageSize).map((tot) => (`
);

content = content.replace(
  "              </tbody>\n            </table>\n          </div>\n        </div>\n      </div>\n    );\n  }\n\n  /* ──────────────────────────────────────────────────────────\n     DEFAULT VIEW 1: TIME OFF REQUESTS LIST VIEW",
  `              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={typesPage}
            totalRecords={MOCK_TIME_OFF_TYPES.length}
            pageSize={typesPageSize}
            onPageChange={(p) => setTypesPage(p)}
            onPageSizeChange={(s) => { setTypesPageSize(s); setTypesPage(1); }}
          />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────
     DEFAULT VIEW 1: TIME OFF REQUESTS LIST VIEW`
);

// 5. Update Requests list rendering
content = content.replace(
  "{filteredRequests.map((req, idx) => {",
  `{filteredRequests.slice((reqPage - 1) * reqPageSize, reqPage * reqPageSize).map((req, idx) => {`
);

content = content.replace(
  "              </tbody>\n            </table>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}",
  `              </tbody>
            </table>
          </div>
        )}
        {filteredRequests.length > 0 && (
          <Pagination
            currentPage={reqPage}
            totalRecords={filteredRequests.length}
            pageSize={reqPageSize}
            onPageChange={(p) => setReqPage(p)}
            onPageSizeChange={(s) => { setReqPageSize(s); setReqPage(1); }}
          />
        )}
      </div>
    </div>
  );
}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated time-off/index.jsx');
