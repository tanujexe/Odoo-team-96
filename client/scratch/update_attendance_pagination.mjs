import fs from 'fs';

const filePath = 'c:/Collage/peoplepay_odoo/Odoo-team-96/client/src/features/attendance/index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Pagination import
if (!content.includes("import { Pagination }")) {
  content = content.replace(
    "import { LoadingState, EmptyState } from '../../components/ui/States';",
    "import { LoadingState, EmptyState } from '../../components/ui/States';\nimport { Pagination } from '../../components/ui/Pagination';"
  );
}

// 2. Add state
if (!content.includes("const [attPage, setAttPage]")) {
  content = content.replace(
    "const [isNewModalOpen, setIsNewModalOpen] = useState(false);",
    `const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [attPage, setAttPage] = useState(1);
  const [attPageSize, setAttPageSize] = useState(10);`
  );
}

// 3. Update tbody mapping
content = content.replace(
  "{filteredLogs.map((log, idx) => {",
  `{filteredLogs.slice((attPage - 1) * attPageSize, attPage * attPageSize).map((log, idx) => {`
);

// 4. Add Pagination component
content = content.replace(
  "              </tbody>\n            </table>\n          </div>\n        )}\n      </div>",
  `              </tbody>
            </table>
          </div>
        )}
        {filteredLogs.length > 0 && (
          <Pagination
            currentPage={attPage}
            totalRecords={filteredLogs.length}
            pageSize={attPageSize}
            onPageChange={(p) => setAttPage(p)}
            onPageSizeChange={(s) => { setAttPageSize(s); setAttPage(1); }}
          />
        )}
      </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated attendance/index.jsx');
