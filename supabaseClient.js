require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const localDb = require('./localDb');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const isPlaceholder = !supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder');

let supabase;

if (isPlaceholder) {
  console.log('--- SUPABASE DETECTED AS PLACEHOLDER: USING LOCAL JSON DATABASE FALLBACK ---');

  function makePromise(promiseFn, context = {}) {
    const promise = new Promise((resolve, reject) => {
      promiseFn(resolve, reject);
    });
    
    promise.eq = (field, val) => {
      return makePromise((resolve) => {
        promise.then(({ data, error }) => {
          if (error) return resolve({ data: null, error });
          const records = Array.isArray(data) ? data : [data];
          const filtered = records.filter(r => String(r[field]) === String(val));
          resolve({ data: filtered, error: null });
        });
      }, context);
    };
    
    promise.single = () => {
      return makePromise((resolve) => {
        promise.then(({ data, error }) => {
          if (error) return resolve({ data: null, error });
          const records = Array.isArray(data) ? data : [data];
          if (records.length === 0) {
            resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
          } else {
            let record = records[0];
            if (context.table === 'student' && context.selectStr && context.selectStr.includes('major')) {
              const major = localDb.findOne('majors', m => m.major_id === record.major_id);
              record = { ...record, major };
            }
            resolve({ data: record, error: null });
          }
        });
      }, context);
    };

    promise.limit = (n) => {
      return makePromise((resolve) => {
        promise.then(({ data, error }) => {
          if (error) return resolve({ data: null, error });
          const records = Array.isArray(data) ? data : [data];
          resolve({ data: records.slice(0, n), error: null });
        });
      }, context);
    };

    promise.order = (field, opts) => {
      return makePromise((resolve) => {
        promise.then(({ data, error }) => {
          if (error) return resolve({ data: null, error });
          const records = Array.isArray(data) ? data : [data];
          const sorted = [...records].sort((a, b) => {
            if (a[field] < b[field]) return opts && opts.ascending === false ? 1 : -1;
            if (a[field] > b[field]) return opts && opts.ascending === false ? -1 : 1;
            return 0;
          });
          resolve({ data: sorted, error: null });
        });
      }, context);
    };

    promise.select = () => promise;

    return promise;
  }

  supabase = {
    from: (table) => {
      const dbTable = table === 'major' ? 'majors' : (table === 'student' ? 'students' : (table === 'checklist_item' ? 'checklist_items' : (table === 'scholarship' ? 'scholarships' : (table === 'scholarship_application' ? 'scholarship_applications' : (table === 'board' ? 'boards' : (table === 'post' ? 'posts' : (table === 'facility' ? 'facilities' : (table === 'notice' ? 'notices' : (table === 'notification' ? 'notifications' : (table === 'course' ? 'courses' : (table === 'enrollment' ? 'enrollments' : table)))))))))));
      
      return {
        select: (selectStr) => {
          return makePromise((resolve) => {
            let records = localDb.get(dbTable);
            if (table === 'post') {
              records = records.map(record => {
                const student = localDb.findOne('students', s => String(s.student_id) === String(record.student_id));
                return { ...record, student };
              });
            } else if (table === 'enrollment') {
              records = records.map(record => {
                const course = localDb.findOne('courses', c => Number(c.course_id) === Number(record.course_id));
                return { ...record, course };
              });
            }
            resolve({ data: records, error: null });
          }, { table, selectStr });
        },
        insert: (record) => {
          return makePromise((resolve) => {
            const inserted = localDb.insert(dbTable, record);
            resolve({ data: inserted, error: null });
          }, { table });
        },
        update: (updates) => {
          return {
            eq: (field, val) => {
              return makePromise((resolve) => {
                const updated = localDb.update(dbTable, r => String(r[field]) === String(val), updates);
                resolve({ data: updated, error: null });
              }, { table });
            }
          };
        },
        delete: () => {
          return {
            eq: (field, val) => {
              return makePromise((resolve) => {
                localDb.delete(dbTable, r => String(r[field]) === String(val));
                resolve({ error: null });
              }, { table });
            }
          };
        }
      };
    }
  };
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;


