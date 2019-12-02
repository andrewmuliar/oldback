interface DateObject{
    id:number,
    word:string,
    addIng:string
}

interface Preymenuk{
    All:string[],
    Places:RegExp,
    Members:RegExp
}


interface DreamStructure{
    dreamText:string;
    Words: string[], 
    Objects: string[], 
    Places: string[], 
    Date: string[], 
    Time: string[], 
    Members: string[], 
    Actions: string[]
    // ,Character?: string[]
}

export class DreamClass{

    // DateObject
    static DateObject:DateObject[] = 
    [{
        id: 0,
        word: 'завтра',
        addIng: '+1 day'
    },
    {
        id: 1,
        word: 'тижн',
        addIng: '+1 week'
    },
    {
        id: 2,
        word: 'місяц',
        addIng: '+1 month'
    },
    {
        id: 3,
        word: 'року',
        addIng: '+1 year'
    },
    {
        id: 4,
        word: 'рік',
        addIng: '+1 year'
    }];


    private static startWith = new RegExp(/ /);
    private static endWith = new RegExp(/.*(ти|тися|тись|ть)$/);

    private static addictedDate:string[] = ['наступно', 'після', 'через', 'протягом'];

    private static Preymenuk:Preymenuk = {
        All: ['в', 'у', 'на', 'до', 'від', 'під', 'над', 'за', 'крізь', 'через', 'при', 'перед', 'поза', 'з-за', 'біля', 'обабіч', 'коло', 'по', 'з', 'із', 'разом'],
        Places: new RegExp(/(ву|на|до|від|під|над|за|крізь|через|при|перед|поза|з-за|біля|обабіч|коло|по)$/),
        Members: new RegExp(/(з|із|разом)/)
    }

    DreamStructure:DreamStructure = {
        dreamText:'',
        Words: [], 
        Objects: [], 
        Places: [], 
        Date: [], 
        Time: [], 
        Members: [], 
        Actions: []
      };

    constructor(dreamText:string){
        this.DreamStructure.dreamText = dreamText
        this.DreamStructure.Words = this.DreamStructure.dreamText.split(' ')
        this
            .getAction()
            .getMembers()
            .getPlaces()
    }

    getWordById(index:number):string{
        return this.DreamStructure.Words[index]
    }

    getPrevWord(index:number):string{
        return this.DreamStructure.Words[index-1]
    }

    getNextWord(index:number):string{
        return this.DreamStructure.Words[index+1]
    }

    getPlaces():DreamClass{
        this.DreamStructure.Words.forEach( (word, index) => {
            if(DreamClass.Preymenuk.Places.test(word)){
                console.log('index', index, 'word', word)
                this.DreamStructure.Places.push(this.getNextWord(index))
            }
        })
        return this;   
    }

    getAction():DreamClass{
        if(this.DreamStructure.Words){
            this.DreamStructure.Words.forEach(word => {
                if(DreamClass.endWith.test(word)){
                    this.DreamStructure.Actions.push(word.toLowerCase())
                }                
            });
        }
        return this;
    }

    getMembers():DreamClass{
        this.DreamStructure.Words.forEach( (word, index) => {
            if(DreamClass.Preymenuk.Members.test(word)){
                this.DreamStructure.Members.push(this.getNextWord(index))
            }
        })
        return this;
    }
    // getSpaceDate():DreamClass{
    //     if(this.DreamStructure.subStrings){
    //         this.DreamStructure.subStrings.forEach(word => {
    //             if(this.DreamStructure.Date){
    //                 this.DreamStructure.Date
    //             }
    //     });
    //     return this;
    // }

    get returnStructure(){
        return this.DreamStructure
    }

}

const a = new DreamClass('Хочу піти до парку погуляти з Кексом о 12:00');
console.log(a.returnStructure)
// console.log(a.returnStructure)